# Album Splitter Frontend

Next.js frontend for Album Splitter.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Features

- YouTube URL input with track list
- Audio file upload with drag-drop
- Multiple concurrent upload cards
- Real-time progress tracking
- Dark/light theme toggle
- Responsive design

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4
- shadcn/ui
- TanStack Query
- Zustand
- Framer Motion
- React Dropzone

## Environment Variables

### Development
```bash
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://backend:3001
```

### Production (Docker)
```bash
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://backend:3001
```

## Build

```bash
npm run build    # Build for production
npm run start    # Start production server
```

## Docker

The frontend uses a multi-stage Dockerfile:

1. **builder stage**: Installs dependencies and builds the application
2. **runner stage**: Copies standalone build and static assets

The server is configured to bind to `0.0.0.0` for IPv6 compatibility and healthchecks.
