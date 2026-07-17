# Dokploy Deployment Guide — Album Splitter (Web UI)

Full-stack deployment using Docker Compose with 5 services: frontend, backend, worker, PostgreSQL, and Redis.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│    Worker    │
│  (Next.js)   │     │   (NestJS)   │     │  (BullMQ)    │
│   :3000      │     │   :3001      │     │              │
└─────────────┘     └──────┬───────┘     └──────┬───────┘
                           │                     │
                    ┌──────▼───────┐     ┌──────▼───────┐
                    │  PostgreSQL  │     │    Redis     │
                    │   :5432      │     │   :6379      │
                    └──────────────┘     └──────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Multi-service Docker Compose (frontend + backend + worker + postgres + redis) |
| `.env.example` | Environment variables template |

The backend and frontend Dockerfiles are in `packages/backend/Dockerfile` and `packages/frontend/Dockerfile`.

## Step-by-Step Dokploy Deployment

### Prerequisites
- A Dokploy server running (v0.5.0+)
- A GitHub account with the `tolakang/album-splitter` repository
- The `tolakang-web-ui-dev` branch pushed to GitHub

### Step 1: Create a Docker Compose Application in Dokploy

1. Log into your Dokploy dashboard
2. Go to **Project** → **Create Application** (or **Create Compose**)
3. Name it `album-splitter`
4. Select **Docker Compose** as the application type

### Step 2: Configure Source

Under the **General** tab:

| Setting | Value |
|---------|-------|
| **Provider** | GitHub |
| **Repository** | `tolakang/album-splitter` (or your fork) |
| **Branch** | `tolakang-web-ui-dev` |
| **Compose Path** | `./dokploy/docker-compose.yml` |
| **Trigger Type** | On Push |
| **Autodeploy** | Enable (optional) |

Click **Save**.

### Step 3: Configure Environment Variables

Go to the **Environment** tab and paste:

```
# Database
POSTGRES_DB=album_splitter
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Backend
NODE_ENV=production
FRONTEND_URL=https://album.nokor24.com

# Frontend
NEXT_PUBLIC_API_URL=/api
```

**Important:**
- Change `POSTGRES_PASSWORD` to a secure password
- Set `FRONTEND_URL` to your **actual public URL** (e.g., `https://album.nokor24.com`)
- `NEXT_PUBLIC_API_URL=/api` — this must stay as `/api` (relative path)

Click **Save**.

### Step 4: Configure Domain

Go to the **Domains** tab:

1. Click **Add Domain**
2. Enter your domain: `album.nokor24.com`
3. Set the port to `3000` (frontend)
4. Enable **HTTPS** (Let's Encrypt) if available
5. Save

For the backend, you have two options:
- **Option A**: Use the frontend as a proxy (recommended) — the Next.js rewrites handle `/api/*` → backend
- **Option B**: Add a second domain on port `3001` for direct backend access

### Step 5: Deploy

1. Go to the **General** tab
2. Click **Deploy**
3. Wait for the build to complete (first build takes 3-5 minutes)
4. Check the **Logs** tab for any errors

### Step 6: Verify

1. Visit `https://album.nokor24.com`
2. The frontend should load
3. Test uploading an audio file
4. Check the backend health: `https://album.nokor24.com/api/health`

## Troubleshooting

### Build fails with "NEXT_PUBLIC_API_URL not defined"
Make sure `NEXT_PUBLIC_API_URL=/api` is set in the Dokploy **Environment** tab. Next.js requires this at build time.

### Frontend loads but API calls fail (404/500)
1. Check backend is running: `docker compose ps` in the terminal
2. Check backend logs in Dokploy → Logs → select `backend` container
3. Verify `FRONTEND_URL` matches your actual domain (for CORS)

### "No such container" error in Logs
This means no containers are deployed yet. Click **Deploy** in the General tab.

### Database connection errors
1. Ensure PostgreSQL container is healthy (check Logs → postgres)
2. The `DATABASE_URL` is auto-built from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
3. Prisma migrations run automatically on backend startup

### Large file upload fails (413 / 502)
The upload limit is 500MB. If using a reverse proxy (nginx/Caddy), increase `client_max_body_size`.

### FFmpeg errors during splitting
The backend Dockerfile installs FFmpeg. If splitting fails, check worker logs for the specific error.

## Local Development with Docker Compose

```bash
cd dokploy
cp .env.example .env
docker compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger docs: http://localhost:3001/api/docs

## Support

- Issues: https://github.com/tolakang/album-splitter/issues
- Dokploy docs: https://dokploy.com/docs
