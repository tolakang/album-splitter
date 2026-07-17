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

## Quick Start

### Local Development with Docker Compose

1. Copy and configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. Build and start all services:
   ```bash
   docker compose up --build -d
   ```

3. Access:
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:3001/api
   - **Swagger docs:** http://localhost:3001/api/docs

4. Stop:
   ```bash
   docker compose down
   ```

### Deploy to Dokploy

1. In Dokploy, create a new Docker Compose service
2. Point it to `dokploy/docker-compose.yml` in the repository
3. Set environment variables in Dokploy's environment config (or use `.env`)
4. Deploy

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `album_splitter` | PostgreSQL database name |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `DATABASE_URL` | (auto-built) | Full PostgreSQL connection string |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `NODE_ENV` | `production` | Node.js environment |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `NEXT_PUBLIC_API_URL` | `/api` | API URL for frontend (relative = proxied through Next.js) |

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres-data` | PostgreSQL data persistence |
| `redis-data` | Redis persistence (AOF) |
| `album-storage` | Shared storage for uploads, generated files, temp |

## Troubleshooting

### Backend health check fails
```bash
docker compose logs backend
```
Common issues: database not ready (wait for health check), missing Prisma migration (auto-runs on startup).

### Frontend can't reach API
Ensure `NEXT_PUBLIC_API_URL=/api` — this activates the Next.js proxy rewrite to forward `/api/*` to the backend.

### Worker not processing jobs
Check Redis connection:
```bash
docker compose exec redis redis-cli ping
```

## Support

- Issues: https://github.com/tolakang/album-splitter/issues
- Dokploy: https://dokploy.com/docs
