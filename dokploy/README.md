# Dokploy Deployment Guide for Album Splitter

This directory contains all necessary files to deploy Album Splitter using Dokploy, including the web interface.

## Files Included

- **Dockerfile** - Container image definition with Python 3.12, FFmpeg, and album-splitter with web UI
- **docker-compose.yml** - Docker Compose configuration for local development and testing
- **dokploy.json** - Dokploy service configuration
- **.dockerignore** - Files to exclude from Docker build
- **.env.example** - Environment variables template
- **.env.production** - Production environment variables
- **README.md** - This file

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Or Dokploy installed on your server

### Local Development with Docker Compose

1. Create required directories:
```bash
mkdir -p uploads output splits
```

2. Run with Docker Compose:
```bash
docker-compose up --build
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

4. You'll see the Album Splitter web interface where you can:
   - Upload audio files
   - Enter track timestamps
   - Download split tracks

### Deploy to Dokploy

1. Import the `dokploy.json` configuration into your Dokploy instance

2. Configure the service:
   - Repository: `github.com/tolakang/album-splitter.git`
   - Branch: `feature/web-ui-implementation` or `master`
   - Dockerfile location: `dokploy/Dockerfile`

3. Set environment variables in Dokploy:
   - `SECRET_KEY` - **Change this!** Flask secret key for sessions
   - `UPLOAD_FOLDER` - Upload directory (default: `/app/uploads`)
   - `OUTPUT_FOLDER` - Output directory (default: `/app/output`)

4. Configure port mapping:
   - Map port `8000` from container to host

5. Configure volume mounts:
   - `/app/uploads` - Uploaded audio files
   - `/app/output` - Split tracks output
   - `/app/splits` - Alternative output directory

6. Deploy using Dokploy's web interface

## How It Works

### Web Interface
1. User uploads an audio file through the browser
2. User enters track timestamps in the text area
3. Optional: Enter artist and album metadata
4. Click "Upload & Split" to start processing
5. View real-time progress updates
6. Download individual tracks or all files when complete

### Command Line Interface
```bash
# Split a local file
album-splitter -f /path/to/album.mp3 -o /app/splits -t tracks.txt

# Download from YouTube and split
album-splitter -yt "https://youtube.com/watch?v=..." -o /app/splits

# Show help
album-splitter --help
```

## Docker Build

To build manually:
```bash
docker build -f dokploy/Dockerfile -t album-splitter:latest .
```

To run with web interface:
```bash
docker run -p 8000:8000 \
           -v $(pwd)/uploads:/app/uploads \
           -v $(pwd)/output:/app/output \
           -e SECRET_KEY=your-secret-key \
           album-splitter:latest
```

To run CLI only:
```bash
docker run -v $(pwd)/input:/app/input \
           -v $(pwd)/output:/app/output \
           album-splitter:latest \
           album-splitter -f /app/input/album.mp3 -o /app/output
```

## Volume Mounts

| Mount Point | Purpose |
|-------------|---------|
| `/app/uploads` | Uploaded audio files (web UI) |
| `/app/output` | Split tracks output |
| `/app/splits` | Alternative output directory |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `change-this-in-production` |
| `UPLOAD_FOLDER` | Upload directory | `/app/uploads` |
| `OUTPUT_FOLDER` | Output directory | `/app/output` |
| `FLASK_APP` | Flask application module | `album_splitter.web` |
| `PORT` | Server port | `8000` |
| `PYTHONUNBUFFERED` | Disable output buffering | `1` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Web Interface Features

- **File Upload:** Drag-and-drop or click to upload audio files
- **Track Editor:** Enter timestamps with a user-friendly textarea
- **Progress Tracking:** Real-time updates on split progress
- **Download:** Download individual tracks or all files at once
- **Metadata:** Add artist, album, and other metadata tags

## Supported Audio Formats

- MP3
- WAV
- FLAC
- M4A
- OGG
- AAC

## Track Timestamp Formats

```
00:06 - Track Title
03:35 - Another Track
[01:15:30] - Long Track (with hours)
Track Name - 05:20
```

## Troubleshooting

### Port already in use
Change the host port in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Use 8001 instead
```

### FFmpeg not found
Ensure the Docker build completed successfully. FFmpeg is installed in the Dockerfile.

### Permission denied errors
Ensure the container has read/write permissions for mounted volumes:
```bash
chmod 777 uploads output splits
```

### Large file uploads fail
Increase the upload size limit in your reverse proxy (nginx, Apache) if using one. The default Flask limit is 16MB.

### Out of memory
For large audio files, increase Docker's memory limit or use a server with more RAM.

### Build fails with setuptools-scm error
The Dockerfile includes a fallback version (`0.0.0`) for builds without git history. To set a specific version:
```bash
docker build --build-arg SETUPTOOLS_SCM_PRETEND_VERSION=1.0.0 -f dokploy/Dockerfile .
```

## Security Notes

- **Change SECRET_KEY:** Always set a unique `SECRET_KEY` in production
- **HTTPS:** Use a reverse proxy (nginx, Traefik) with SSL for production
- **Authentication:** The web UI has no built-in auth. Add authentication via reverse proxy if needed

## Performance

The default configuration uses:
- 4 Gunicorn workers
- 2 threads per worker
- Total: 8 concurrent request handlers

Adjust in `dokploy/Dockerfile` or `docker-compose.yml` based on your server resources.

## Support

For issues related to Album Splitter functionality, see: https://github.com/tolakang/album-splitter/issues

For Dokploy-specific issues, see: https://dokploy.com/docs
