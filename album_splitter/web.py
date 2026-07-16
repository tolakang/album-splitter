"""
Web interface for Album Splitter
A simple Flask application to upload audio files and split them into tracks.
"""
import os
import tempfile
import threading
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'album-splitter-secret-key-change-in-production')

# Configuration
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/album-splitter-uploads')
OUTPUT_FOLDER = os.environ.get('OUTPUT_FOLDER', '/tmp/album-splitter-output')
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac'}

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Store for tracking processing jobs
jobs = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html', jobs=jobs)

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if file is in request
    if 'audio_file' not in request.files:
        flash('No file selected')
        return redirect(url_for('index'))
    
    file = request.files['audio_file']
    if file.filename == '':
        flash('No file selected')
        return redirect(url_for('index'))
    
    if file and allowed_file(file.filename):
        # Generate unique job ID
        job_id = str(uuid.uuid4())[:8]
        job_folder = os.path.join(UPLOAD_FOLDER, job_id)
        os.makedirs(job_folder, exist_ok=True)
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(job_folder, filename)
        file.save(filepath)
        
        # Get tracks data
        tracks_data = request.form.get('tracks_data', '')
        artist = request.form.get('artist', '')
        album = request.form.get('album', '')
        
        # Save tracks.txt
        tracks_file = os.path.join(job_folder, 'tracks.txt')
        with open(tracks_file, 'w') as f:
            f.write(tracks_data)
        
        # Create output folder
        output_folder = os.path.join(OUTPUT_FOLDER, job_id)
        os.makedirs(output_folder, exist_ok=True)
        
        # Initialize job
        jobs[job_id] = {
            'status': 'pending',
            'filename': filename,
            'artist': artist,
            'album': album,
            'progress': 0,
            'message': 'Waiting to start...'
        }
        
        # Start processing in background
        thread = threading.Thread(target=process_audio, args=(job_id, filepath, tracks_file, output_folder, artist, album))
        thread.daemon = True
        thread.start()
        
        return redirect(url_for('job_status', job_id=job_id))
    
    flash('Invalid file type. Allowed: ' + ', '.join(ALLOWED_EXTENSIONS))
    return redirect(url_for('index'))

def process_audio(job_id, audio_file, tracks_file, output_folder, artist, album):
    """Process audio file in background thread"""
    from . import split_file, tag_file, parse_tracks
    
    try:
        jobs[job_id]['status'] = 'processing'
        jobs[job_id]['progress'] = 10
        jobs[job_id]['message'] = 'Reading tracks...'
        
        # Read tracks
        tracks_content = Path(tracks_file).read_text(encoding='utf-8', errors='ignore')
        tracks = parse_tracks.parse_tracks(tracks_content)
        
        if not tracks:
            jobs[job_id]['status'] = 'error'
            jobs[job_id]['message'] = 'No tracks found in tracks file'
            return
        
        jobs[job_id]['progress'] = 30
        jobs[job_id]['message'] = f'Found {len(tracks)} tracks. Splitting...'
        
        # Split file
        output_files = split_file.split_file(
            Path(audio_file), 
            tracks, 
            Path(output_folder),
            output_format=audio_file.split('.')[-1]
        )
        
        jobs[job_id]['progress'] = 70
        jobs[job_id]['message'] = 'Tagging files...'
        
        # Tag files
        tag_data = {
            'artist': artist if artist else None,
            'album': album if album else None,
        }
        
        for index, file in enumerate(output_files):
            track = tracks[index]
            tag_data.update({
                'title': str(track.title),
                'tracknumber': index + 1
            })
            tag_file.tag_file(file, tag_data)
        
        jobs[job_id]['progress'] = 100
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['message'] = f'Successfully split into {len(output_files)} tracks'
        jobs[job_id]['output_files'] = [str(f) for f in output_files]
        
    except Exception as e:
        jobs[job_id]['status'] = 'error'
        jobs[job_id]['message'] = f'Error: {str(e)}'

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
    return jsonify(jobs[job_id])

@app.route('/download/<job_id>/<filename>')
def download_file(job_id, filename):
    if job_id not in jobs or 'output_files' not in jobs[job_id]:
        flash('File not available')
        return redirect(url_for('index'))
    
    # Find the file
    output_folder = os.path.join(OUTPUT_FOLDER, job_id)
    filepath = os.path.join(output_folder, filename)
    
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    
    flash('File not found')
    return redirect(url_for('job_status', job_id=job_id))

def create_app():
    """Application factory for gunicorn"""
    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
