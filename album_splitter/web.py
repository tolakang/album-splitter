"""
Web interface for Album Splitter
"""
import io
import os
import threading
import zipfile
import time
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'album-splitter-secret-key-change-in-production')

# Configuration
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/album-splitter-uploads')
OUTPUT_FOLDER = os.environ.get('OUTPUT_FOLDER', '/tmp/album-splitter-output')
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac', 'wma'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# In-memory job store (fine for single-worker; use Redis/DB for multi-worker)
jobs = {}

import threading as _threading
_jobs_lock = _threading.Lock()

def _update_job(job_id, **kwargs):
    with _jobs_lock:
        if job_id in jobs:
            jobs[job_id].update(kwargs)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html', jobs=jobs)

@app.route('/upload', methods=['POST'])
def upload_file():
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    def _err(msg):
        if is_ajax:
            return jsonify({'error': msg}), 400
        flash(msg)
        return redirect(url_for('index'))

    if 'audio_file' not in request.files:
        return _err('No file selected')

    file = request.files['audio_file']
    if file.filename == '':
        return _err('No file selected')

    if not file or not allowed_file(file.filename):
        return _err('Invalid file type. Allowed: ' + ', '.join(sorted(ALLOWED_EXTENSIONS)))

    # Validate tracks data
    tracks_data = request.form.get('tracks_data', '').strip()
    if not tracks_data:
        return _err('Please enter at least one track timestamp')

    job_id = str(uuid.uuid4())[:8]
    job_folder = os.path.join(UPLOAD_FOLDER, job_id)
    os.makedirs(job_folder, exist_ok=True)

    filename = secure_filename(file.filename)
    filepath = os.path.join(job_folder, filename)
    file.save(filepath)

    # Validate file size
    file_size = os.path.getsize(filepath)
    if file_size > MAX_FILE_SIZE:
        os.remove(filepath)
        return _err(f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB')

    artist = request.form.get('artist', '').strip()
    album = request.form.get('album', '').strip()

    tracks_file = os.path.join(job_folder, 'tracks.txt')
    with open(tracks_file, 'w') as f:
        f.write(tracks_data)

    output_folder = os.path.join(OUTPUT_FOLDER, job_id)
    os.makedirs(output_folder, exist_ok=True)

    with _jobs_lock:
        jobs[job_id] = {
            'status': 'pending',
            'filename': filename,
            'artist': artist,
            'album': album,
            'progress': 0,
            'message': 'Waiting to start...',
            'output_files': [],
            'track_count': 0,
            'created_at': time.time(),
        }

    thread = threading.Thread(
        target=process_audio,
        args=(job_id, filepath, tracks_file, output_folder, artist, album),
        daemon=True,
    )
    thread.start()

    if is_ajax:
        return jsonify({'job_id': job_id, 'redirect': url_for('job_status', job_id=job_id)})

    return redirect(url_for('job_status', job_id=job_id))

def process_audio(job_id, audio_file, tracks_file, output_folder, artist, album):
    """Process audio file in background thread."""
    from .parse_tracks import parse_tracks
    from .split_file import split_file
    from .tag_file import tag_file

    try:
        _update_job(job_id, status='processing', progress=10, message='Reading tracks...')

        tracks_content = Path(tracks_file).read_text(encoding='utf-8', errors='ignore')
        tracks = parse_tracks(tracks_content)

        if not tracks:
            _update_job(job_id, status='error', message='No tracks found. Check your timestamp format.')
            return

        _update_job(
            job_id,
            progress=20,
            track_count=len(tracks),
            message=f'Found {len(tracks)} tracks. Splitting audio...',
        )

        # Determine output format from input file extension
        input_ext = Path(audio_file).suffix.lstrip('.')

        output_files = split_file(
            Path(audio_file),
            tracks,
            Path(output_folder),
            output_format=input_ext,
        )

        _update_job(job_id, progress=70, message='Tagging files...')

        tag_data = {}
        if artist:
            tag_data['artist'] = artist
        if album:
            tag_data['album'] = album

        for index, file in enumerate(output_files):
            track = tracks[index]
            tag_data.update({
                'title': str(track.title),
                'tracknumber': index + 1,
            })
            tag_file(file, tag_data)

            # Update progress per track
            pct = 70 + int((index + 1) / len(output_files) * 25)
            _update_job(job_id, progress=pct, message=f'Tagged {index + 1}/{len(output_files)} tracks...')

        file_names = [f.name for f in output_files]
        _update_job(
            job_id,
            progress=100,
            status='completed',
            message=f'Done! {len(output_files)} tracks ready.',
            output_files=file_names,
        )

    except Exception as e:
        _update_job(job_id, status='error', message=f'Error: {str(e)}')

@app.route('/job/<job_id>')
def job_status(job_id):
    if job_id not in jobs:
        flash('Job not found')
        return redirect(url_for('index'))
    return render_template('job.html', job=jobs[job_id], job_id=job_id)

@app.route('/api/job/<job_id>')
def api_job_status(job_id):
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404
    with _jobs_lock:
        return jsonify(jobs[job_id])

@app.route('/download/<job_id>/<filename>')
def download_file(job_id, filename):
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404

    output_folder = os.path.join(OUTPUT_FOLDER, job_id)
    filepath = os.path.join(output_folder, secure_filename(filename))

    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)

    return jsonify({'error': 'File not found'}), 404

@app.route('/download/<job_id>/zip')
def download_zip(job_id):
    if job_id not in jobs or not jobs[job_id].get('output_files'):
        return jsonify({'error': 'No files available'}), 404

    output_folder = os.path.join(OUTPUT_FOLDER, job_id)
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for filename in jobs[job_id]['output_files']:
            filepath = os.path.join(output_folder, secure_filename(filename))
            if os.path.exists(filepath):
                zf.write(filepath, filename)

    zip_buffer.seek(0)
    zip_name = f"{jobs[job_id].get('filename', 'album')}_tracks.zip"

    return send_file(
        zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_name,
    )

def create_app():
    """Application factory for gunicorn."""
    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
