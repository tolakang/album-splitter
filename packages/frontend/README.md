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

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Query
- Zustand
- Framer Motion
- React Dropzone

## Environment Variables

For development:
```bash
NEXT_PUBLIC_API_URL=/api   # Relative path (Next.js proxy via next.config.ts)
```

For production (Docker):
```bash
NEXT_PUBLIC_API_URL=/api   # Relative path (routed through reverse proxy)
BACKEND_URL=http://backend:3001  # Internal container communication (only for rewrites)
```

## Build

```bash
npm run build    # Build for production
npm run start    # Start production server
```
