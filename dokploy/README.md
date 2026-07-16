# Dokploy Deployment Guide for Album Splitter

This directory contains all necessary files to deploy Album Splitter using Dokploy.

## Files Included

- **Dockerfile** - Container image definition with Python 3.12, FFmpeg, and album-splitter installed
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

1. Create input and output directories:
```bash
mkdir -p input output splits
```

2. Place your audio files in the `input` folder and `tracks.txt` in the same folder

3. Run with Docker Compose:
```bash
docker-compose up --build
```

4. Your split tracks will appear in the `splits` folder

### Deploy to Dokploy

1. Import the `dokploy.json` configuration into your Dokploy instance

2. Configure the service with your repository settings:
   - Repository: `github.com/tolakang/album-splitter.git`
   - Branch: `feature/web-ui-implementation` or `master`
   - Dockerfile location: `dokploy/Dockerfile`

3. Set environment variables in Dokploy:
   - `OUTPUT_FOLDER` - Path for output files (default: `/app/output`)
   - `TEMP_FOLDER` - Path for temporary files (default: `/app/input`)
   - `LOG_LEVEL` - Logging level (default: `INFO`)

4. Configure volume mounts:
   - `/app/input` - Input audio files directory
   - `/app/output` - Output directory for split tracks
   - `/app/splits` - Alternative output directory

5. Deploy using Dokploy's web interface

## How It Works

When the container starts, it automatically:
1. Scans `/app/input/` for MP3 files
2. Splits each file using `album-splitter`
3. Saves split tracks to `/app/splits/`
4. Copies tracks to `/app/output/`

### Custom Commands

You can override the default command in Dokploy to run specific operations:

```bash
# Split a specific file with custom tracks
album-splitter -f /app/input/album.mp3 -o /app/splits -t tracks.txt

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

To run a container:
```bash
docker run -v $(pwd)/input:/app/input \
           -v $(pwd)/output:/app/output \
           album-splitter:latest
```

## Volume Mounts

The deployment uses the following volumes:

- `/app/input` - Input audio files directory
- `/app/output` - Output directory for split tracks
- `/app/splits` - Alternative output directory (kept for compatibility)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OUTPUT_FOLDER` | Path for output files | `/app/output` |
| `TEMP_FOLDER` | Path for temporary files | `/app/input` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `PYTHONUNBUFFERED` | Disable Python output buffering | `1` |

See `.env.example` for additional configuration options.

## Troubleshooting

### FFmpeg not found
Make sure FFmpeg is installed in the container. The Dockerfile includes this, but verify the build was successful.

### Permission denied errors
Ensure the container has read/write permissions for mounted volumes:
```bash
chmod 777 input output splits
```

### Out of memory
For large audio files, you may need to increase Docker's memory limit.

### Build fails with setuptools-scm error
The Dockerfile includes a fallback version (`0.0.0`) for builds without git history. If you need a specific version, set it via build args:
```bash
docker build --build-arg SETUPTOOLS_SCM_PRETEND_VERSION=1.0.0 -f dokploy/Dockerfile .
```

## Support

For issues related to Album Splitter functionality, see: https://github.com/tolakang/album-splitter/issues

For Dokploy-specific issues, see: https://dokploy.com/docs
