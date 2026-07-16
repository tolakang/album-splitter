# Dokploy Deployment Guide for Album Splitter

This directory contains all necessary files to deploy Album Splitter using Dokploy.

## Files Included

- **Dockerfile** - Container image definition with Python 3.12, FFmpeg, and album-splitter installed
- **docker-compose.yml** - Docker Compose configuration for local development and testing
- **dokploy.json** - Dokploy service configuration
- **.dockerignore** - Files to exclude from Docker build
- **.env.example** - Environment variables template
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

4. Your split tracks will appear in the `output` folder

### Deploy to Dokploy

1. Copy all files from this directory to your Dokploy server

2. Configure your Dokploy instance with the provided `dokploy.json` configuration

3. Set environment variables in `.env` based on `.env.example`

4. Deploy using Dokploy's CLI or web interface

## Docker Build

To build manually:
```bash
docker build -f dokploy/Dockerfile -t album-splitter:latest .
```

To run a container:
```bash
docker run -v $(pwd)/input:/app/input \
           -v $(pwd)/output:/app/output \
           album-splitter:latest \
           python -m album_splitter --file /app/input/album.mp3
```

## Volume Mounts

The deployment uses the following volumes:

- `/app/input` - Input audio files directory
- `/app/output` - Output directory for split tracks
- `/app/splits` - Alternative output directory (kept for compatibility)

## Environment Variables

See `.env.example` for available configuration options.

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

## Support

For issues related to Album Splitter functionality, see: https://github.com/tolakang/album-splitter/issues

For Dokploy-specific issues, see: https://dokploy.com/docs
