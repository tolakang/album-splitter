# Album Splitter

Split single-file MP3 albums into individual tracks. Download from YouTube supported.

## Features

- **YouTube Integration**: Download and split YouTube videos
- **Audio File Upload**: Split local audio files (MP3, WAV, FLAC, OGG, M4A)
- **Track Parsing**: Parse timestamps (MM:SS or HH:MM:SS) from text files
- **Metadata Tagging**: Write ID3 tags (artist, album, year, track number)
- **Web Interface**: Modern React UI with dark mode
- **Batch Processing**: Split multiple albums simultaneously
- **ZIP Download**: Download all tracks as a single ZIP file
- **Auto Cleanup**: Files expire after 1 hour

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- FFmpeg

### Local Development

```bash
# Clone repository
git clone https://github.com/tolakang/album-splitter.git
cd album-splitter

# Install backend dependencies
cd packages/backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Install frontend dependencies (new terminal)
cd packages/frontend
npm install
npm run dev
```

### Docker Deployment

```bash
# Clone repository
git clone https://github.com/tolakang/album-splitter.git
cd album-splitter

# Start all services
cd dokploy
docker compose up -d

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - Swagger Docs: http://localhost:3001/api/docs
```

### Docker Commands

Use the Makefile for common operations:

```bash
make up        # Start all services
make down      # Stop all services
make build     # Build Docker images
make logs      # View logs
make test      # Run backend tests
make migrate   # Run database migrations
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/albums` | Create new album |
| GET | `/api/albums` | List all albums |
| GET | `/api/albums/:id` | Get album by ID |
| DELETE | `/api/albums/:id` | Delete album |
| POST | `/api/upload/:albumId` | Upload audio file |
| GET | `/api/download/:fileId` | Download single file |
| GET | `/api/download/zip/:albumId` | Download album as ZIP |
| DELETE | `/api/download/:fileId` | Delete generated file |
| POST | `/api/cleanup` | Trigger manual cleanup |

## CLI Usage

```bash
# Split local file
album-splitter -f album.mp3 -t tracks.txt

# Split from YouTube
album-splitter -yt https://youtube.com/watch?v=... -t tracks.txt

# With metadata
album-splitter -f album.mp3 -t tracks.txt -a "Artist" -A "Album" -y 2024
```

## Track List Format

```
00:00 Track 1 Title
03:45 Track 2 Title
07:30 Track 3 Title
11:15 Track 4 Title
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/album_splitter

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=changeme

# Frontend
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://backend:3001

# Backend
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Architecture

```
Frontend (Next.js) → Backend API (NestJS) → Queue (BullMQ/Redis) → Worker → FFmpeg → Storage
```

## Container-Native Features

- **Resource Limits**: All services have memory and CPU limits
- **Health Checks**: Node-based healthchecks for reliable monitoring
- **Log Rotation**: Automatic log rotation to prevent disk fill
- **Redis Authentication**: Password-protected Redis
- **Migration Service**: Dedicated service for database migrations

## License

GPL-3.0
