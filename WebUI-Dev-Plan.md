# Album Splitter Web UI — Comprehensive Development Plan

**Version:** 1.0

## Target Deployment

- Dokploy
- Docker Compose
- PostgreSQL
- Redis (Queue & Cache)
- Object/File Storage (Local Docker Volume)
- Traefik Reverse Proxy

---

# Phase 1 — Research Existing Repository

**Repository:** `tolakang/album-splitter`

## Objective

Before writing any code, Copilot must completely understand the current project. No feature should be rewritten without first understanding how the original implementation works.

## Phase 1 Tasks

### 1. Project Analysis

Learn:
- Project structure
- Language
- Dependencies
- Entry point
- Execution flow

Document:
- How album splitting works
- How YouTube download works
- How ffmpeg is called
- How `tracks.txt` is parsed
- How filenames are generated
- How output directory is generated
- How cleanup works
- Error handling
- Limitations

### 2. Reverse Engineer Features

Identify every available feature, for example:
- Download audio from YouTube
- Split album
- Parse timestamps
- Metadata generation
- File naming
- Album naming
- Thumbnail support
- FFmpeg arguments
- Supported audio formats

Nothing should be missed.

### 3. Produce Documentation

Generate `docs/original-analysis.md` including:
- Architecture
- Workflow
- Algorithms
- Functions
- Reusable code
- Improvements

---

# Phase 2 — Design New System

**Goal:** Create a complete web application. NOT simply wrapping CLI. Everything should become API-driven.

## High Level Architecture

```
Frontend → REST API → Queue → Worker → FFmpeg Engine → Storage → Downloads
```

## Technology Stack

### Frontend

- React
- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- TanStack Query
- Zustand
- Motion
- React Dropzone

### Backend

- Node.js
- NestJS
- TypeScript
- BullMQ
- FFmpeg
- yt-dlp
- PostgreSQL
- Redis
- Prisma ORM
- Swagger
- Zod validation

### Database

- PostgreSQL

### Queue

- Redis / BullMQ

### Storage (Docker Volume)

```
uploads/
generated/
temp/
logs/
```

### Deployment

- Docker
- Docker Compose
- Dokploy

---

# Phase 3 — Backend Design

## Modules

### Authentication

Initially disabled. Designed for future support.

### Album Module

Responsible for:
- Album creation
- Album metadata
- Status

### Upload Module

- Store uploaded files
- Track progress
- Cleanup

### Split Module

Responsible for:
- Queue
- FFmpeg
- Split
- Progress

### YouTube Module

Responsible for:
- yt-dlp
- Metadata
- Download
- Thumbnail
- Title

### Track Parser Module

Accept:
- Paste text
- or `tracks.txt`

Return:
- Structured timestamps

### Download Module

- Generate ZIP
- Serve download
- Delete generated data

### Cleanup Module

Auto delete:
- Uploaded files — delete immediately when job finished AND ZIP downloaded
- Generated files — expire after 1 hour, background scheduler every 5 minutes

### Queue Module

- BullMQ
- Multiple workers
- Progress
- Retry
- Failure handling

## Backend File Storage

```
/storage
  uploads/
  generated/
  temp/
  thumbnails/
  logs/
```

### Auto Cleanup

- Uploaded audio: delete immediately when job finished AND ZIP downloaded
- Generated files: expire after 1 hour, background scheduler every 5 minutes

## Database

### Album
```
id, title, youtubeUrl, status, createdAt, expiresAt
```

### Task
```
id, albumId, progress, status, queueId
```

### Generated File
```
id, albumId, filename, size, path, downloaded, expiresAt
```

---

# Phase 4 — Frontend

## General Layout

```
Header → Section 1 → Section 2 → Footer
```

Modern responsive: Desktop, Tablet, Mobile.

## Section 1 — YouTube Album Splitter

Accordion (collapse/expand).

### Part 1 — Input

- Input: YouTube URL
- Next: Choose Option A (Paste Track List) OR Option B (Upload `tracks.txt`). Only one required.

### Part 2 — Album Title

- Optional (if empty, backend automatically uses YouTube title)
- Button: `Split Album` (desktop: inline, mobile: below)

### Part 3 — Results Container

- Initially hidden; appear ONLY after `Split Album`
- Statuses: Generating, Progress, Completed, Ready, Failed
- Each generated file: Download, Delete

### Part 4 — Bottom Buttons

- Initially hidden; appear after generation completed
- Buttons: `Download ZIP`, `Clear Downloaded`
- ZIP filename: `<Album Name>.zip`

## Section 2 — Upload Cards

Accordion with multiple upload cards.

### Upload Card

Contains:
- Upload Audio
- Paste Track List OR Upload `tracks.txt`
- Split Album

Validation: Enable Split button ONLY when audio exists AND track list exists.

Dynamic Cards:
- Card 1: `+` to add
- New cards: `+` / `-`
- Unlimited

Each card:
- Independent
- Own queue
- Own progress
- Own output

Results:
- Hidden initially; appear after `Split Album`
- Each row: Album Name, Progress, Download ZIP, Delete

Expiration: 1 hour with countdown badge.

## UX Improvements

- Progress bar
- Estimated remaining time
- Queue position
- Cancel job
- Retry job
- Toast notifications
- Drag & Drop upload
- Dark mode / Light mode
- Responsive
- Keyboard accessible
- ARIA support

## API

| Method | Endpoint |
|--------|----------|
| POST | `/api/youtube` |
| POST | `/api/upload` |
| POST | `/api/split` |
| GET | `/api/task/:id` |
| GET | `/api/download/:id` |
| DELETE | `/api/generated/:id` |
| DELETE | `/api/cleanup` |
| GET | `/api/albums` |

## Background Jobs

Worker pipeline:

```
Download YouTube → Extract Audio → Parse Tracks → Split → Generate Metadata → Zip → Mark Ready → Schedule Cleanup
```

## Docker Architecture

```
Frontend → Backend API → Redis → Postgres → Worker → FFmpeg → Storage Volume
```

## Dokploy Deployment

Services: `frontend`, `backend`, `worker`, `postgres`, `redis`

Volumes: `postgres-data`, `redis-data`, `album-storage`

Networks: `internal`, `public`

---

# Future Features

- User accounts
- Job history
- Batch YouTube playlists
- S3 storage / Cloudflare R2
- Multiple workers
- Email notifications
- WebSocket live progress
- Audio waveform preview
- Metadata editor
- Cover art editing
- Subtitle/chapters import
- API tokens

---

# GitHub Copilot Development Rules

Copilot should follow these implementation rules throughout the project:

1. **Preserve original functionality:** Every feature from `tolakang/album-splitter` must be implemented before introducing enhancements.
2. **API-first architecture:** The frontend must never invoke FFmpeg, yt-dlp, or filesystem operations directly. All processing goes through backend APIs.
3. **Modular design:** Each backend feature (YouTube download, upload, parsing, splitting, cleanup, ZIP generation) must reside in its own module with clear interfaces.
4. **Asynchronous processing:** All long-running tasks must use BullMQ queues. No request should block until splitting finishes.
5. **Stateless frontend:** The frontend should rely on API responses and real-time updates (preferably WebSockets or Server-Sent Events) instead of storing job state locally.
6. **Production-ready deployment:** Every service must run in Docker with health checks, structured logging, graceful shutdown, and persistent volumes compatible with Dokploy.
7. **Code quality:** Use TypeScript strict mode, ESLint, Prettier, unit tests for core parsing logic, and integration tests for the API where practical.
8. **Scalability:** Design the worker service so multiple instances can process jobs concurrently without code changes.
9. **Security:** Validate all uploaded files, sanitize filenames, limit upload sizes, and never expose filesystem paths to clients.
10. **Extensibility:** New input sources (Spotify, Bandcamp, local playlists, etc.) should be implementable by adding modules rather than modifying existing core logic.

---

This plan provides a solid roadmap for building a modern, scalable Album Splitter Web UI while remaining faithful to the original repository's capabilities and making it well suited for deployment on Dokploy.
