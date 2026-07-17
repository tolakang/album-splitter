# Improved Container-Native Development Plan

## Executive Summary

The current container setup was built iteratively (fixing deployment issues one at a time) rather than designed correctly upfront. This plan addresses 18 issues found across 5 categories: critical architectural issues, medium-priority improvements, CI/CD gaps, security hardening, and developer experience.

---

## Current Architecture

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Next.js 16 + React 19 | ⚠️ Healthcheck may fail in Alpine |
| Backend API | NestJS 11 + Prisma 7 | ⚠️ Migration runs in-app container |
| Worker | NestJS + BullMQ | ⚠️ Uses API entrypoint |
| Database | PostgreSQL 16 | ✅ |
| Queue | Redis 7 | ⚠️ No authentication |
| Proxy | Traefik (via Dokploy) | ⚠️ Variable interpolation may fail |
| Orchestration | Docker Compose | ⚠️ No resource limits, no CI |

---

## Issues Found (Prioritized)

### 🔴 Critical (5 issues)

1. **CI doesn't test Docker builds** — Python-only CI, no Docker/frontend/backend testing
2. **Prisma migrations run inside app container** — Failed migrations block startup or fail silently
3. **No resource limits** — FFmpeg can consume unlimited memory
4. **Healthchecks may fail** — `wget` availability in Alpine not guaranteed for all checks
5. **`BACKEND_URL` not explicitly set** — Frontend relies on implicit service name resolution

### 🟡 Medium (8 issues)

6. **Worker uses API Dockerfile** — Unnecessary code in worker image
7. **No Redis authentication** — Runs without password
8. **Inconsistent `.env.example` files** — Root vs dokploy versions differ
9. **No `.env` validation** — Missing vars cause silent failures
10. **Docker layer cache not optimized** — Any source change invalidates npm cache
11. **No rate limiting** — 500MB upload limit documented but not enforced
12. **No log rotation** — Containers can fill disk
13. **Traefik variable interpolation** — Special characters may break labels

### 🟢 Minor (5 issues)

14. **README references `dokploy-new`** — Should be `dokploy`
15. **No graceful shutdown for worker** — In-progress jobs may be lost
16. **No tmpfs mounts** — Worker uses disk for temp files
17. **No structured logging** — Hard to parse in production
18. **No Makefile** — Common commands not documented

---

## Implementation Plan

### Phase 1: Critical Fixes (Priority: HIGH)

#### 1.1 Extract Migration to Separate Service
**Problem:** Prisma migrations run inside the app container, coupling app lifecycle with migrations.

**Solution:** Create a dedicated `migrate` service that runs once and exits.

```yaml
# dokploy/docker-compose.yml
migrate:
  build:
    context: ../packages/backend
    dockerfile: Dockerfile
  command: npx prisma migrate deploy
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
  depends_on:
    postgres:
      condition: service_healthy
  restart: "no"
  profiles:
    - migration  # Only runs with --profile migration
```

**Files to modify:**
- `dokploy/docker-compose.yml` — Add migrate service
- `packages/backend/docker-entrypoint.sh` — Remove migration logic
- `dokploy/README.md` — Document migration workflow

#### 1.2 Add Resource Limits
**Problem:** FFmpeg can consume unlimited memory, causing OOM kills.

**Solution:** Add resource limits to all services.

```yaml
# dokploy/docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    # ...
  
  worker:
    deploy:
      resources:
        limits:
          memory: 4G  # FFmpeg needs more
          cpus: '2.0'
    # ...
  
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

**Files to modify:**
- `dokploy/docker-compose.yml`

#### 1.3 Fix Healthchecks
**Problem:** `wget` may not be available or reliable in Alpine for healthchecks.

**Solution:** Use `node` for healthchecks (guaranteed available).

```yaml
# dokploy/docker-compose.yml
frontend:
  healthcheck:
    test: ["CMD", "node", "-e", "fetch('http://localhost:3000').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s

backend:
  healthcheck:
    test: ["CMD", "node", "-e", "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Files to modify:**
- `dokploy/docker-compose.yml`

#### 1.4 Set BACKEND_URL Explicitly
**Problem:** Frontend relies on implicit service name resolution.

**Solution:** Add explicit env var.

```yaml
frontend:
  environment:
    - BACKEND_URL=http://backend:3001
```

**Files to modify:**
- `dokploy/docker-compose.yml`

#### 1.5 Add Docker Build CI
**Problem:** No CI tests Docker builds or runs e2e tests.

**Solution:** Create a new workflow.

```yaml
# .github/workflows/docker.yml
name: Docker Build & Test

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: |
          docker compose -f dokploy/docker-compose.yml build
      
      - name: Start services
        run: |
          docker compose -f dokploy/docker-compose.yml up -d
          sleep 30
      
      - name: Run healthchecks
        run: |
          docker compose -f dokploy/docker-compose.yml ps | grep -q "healthy"
      
      - name: Run backend tests
        run: |
          docker compose -f dokploy/docker-compose.yml exec -T backend npm test
      
      - name: Cleanup
        if: always()
        run: docker compose -f dokploy/docker-compose.yml down -v
```

**Files to create:**
- `.github/workflows/docker.yml`

---

### Phase 2: Medium Priority (Priority: MEDIUM)

#### 2.1 Optimize Docker Layer Caching
**Problem:** Any source change invalidates npm cache.

**Solution:** Use multi-stage build with separate dependency layer.

```dockerfile
# packages/backend/Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# ... rest of Dockerfile
```

**Files to modify:**
- `packages/backend/Dockerfile`
- `packages/frontend/Dockerfile`

#### 2.2 Add Redis Authentication
**Problem:** Redis runs without authentication.

**Solution:** Add password and configure connections.

```yaml
# dokploy/docker-compose.yml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD}
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD}
```

**Files to modify:**
- `dokploy/docker-compose.yml`
- `dokploy/.env.example` — Add `REDIS_PASSWORD`
- `packages/backend/src/queue/queue.module.ts` — Update Redis connection

#### 2.3 Consolidate Environment Configuration
**Problem:** Root and dokploy `.env.example` files are inconsistent.

**Solution:** Create a single source of truth.

```bash
# dokploy/.env.example (comprehensive)
# Application
NODE_ENV=production
APP_NAME=album-splitter

# Frontend
FRONTEND_PORT=3000
FRONTEND_DOMAIN=example.com
FRONTEND_URL=https://example.com
BACKEND_URL=http://backend:3001
NEXT_PUBLIC_API_URL=https://api.example.com

# Backend
BACKEND_PORT=3001
BACKEND_HOST=api.example.com
BACKEND_URL=https://api.example.com

# Database
POSTGRES_USER=album_splitter
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=album_splitter

# Redis
REDIS_PASSWORD=CHANGE_ME

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
```

**Files to modify:**
- `dokploy/.env.example`
- Root `.env.example` — Simplify to reference dokploy version

#### 2.4 Add .env Validation
**Problem:** Missing env vars cause silent failures.

**Solution:** Add Zod validation at app startup.

```typescript
// packages/backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_PASSWORD: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // ... other required vars
});

export const env = envSchema.parse(process.env);
```

**Files to create:**
- `packages/backend/src/config/env.ts`
- `packages/frontend/src/config/env.ts`

#### 2.5 Add Log Rotation
**Problem:** Containers can fill disk with logs.

**Solution:** Configure logging driver.

```yaml
# dokploy/docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Files to modify:**
- `dokploy/docker-compose.yml`

---

### Phase 3: Low Priority (Priority: LOW)

#### 3.1 Add docker-compose.override.yml for Local Dev
**Solution:** Separate dev overrides for hot reload.

```yaml
# docker-compose.override.yml
services:
  backend:
    volumes:
      - ../packages/backend/src:/app/src
    command: npm run start:dev
  
  frontend:
    volumes:
      - ../packages/frontend/src:/app/src
    command: npm run dev
```

**Files to create:**
- `docker-compose.override.yml`

#### 3.2 Add Makefile
**Solution:** Document common commands.

```makefile
# Makefile
.PHONY: up down build logs test

up:
	docker compose -f dokploy/docker-compose.yml up -d

down:
	docker compose -f dokploy/docker-compose.yml down

build:
	docker compose -f dokploy/docker-compose.yml build

logs:
	docker compose -f dokploy/docker-compose.yml logs -f

test:
	docker compose -f dokploy/docker-compose.yml exec backend npm test

migrate:
	docker compose -f dokploy/docker-compose.yml --profile migration run migrate
```

**Files to create:**
- `Makefile`

#### 3.3 Fix README
**Problem:** References `dokploy-new` directory.

**Solution:** Update to `dokploy`.

**Files to modify:**
- `README.md`

---

## Testing Strategy

### Unit Tests
- Backend: Existing Jest tests
- Frontend: Existing Vitest tests

### Integration Tests
- Database connectivity
- Redis queue operations
- API endpoints

### E2E Tests
- Docker compose stack healthchecks
- Frontend → Backend API calls
- File upload/download flow

### Docker Tests
- Image builds successfully
- Services start and become healthy
- Resource limits are respected
- Migrations run correctly

---

## Success Criteria

- [ ] All critical issues resolved
- [ ] CI builds and tests Docker images
- [ ] Resource limits prevent OOM kills
- [ ] Healthchecks work reliably
- [ ] Redis is authenticated
- [ ] Environment is validated at startup
- [ ] Documentation is accurate and complete

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Critical Fixes | 1-2 days | None |
| Phase 2: Medium Priority | 2-3 days | Phase 1 |
| Phase 3: Low Priority | 1 day | Phase 2 |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration service fails | High | Test with backup database |
| Healthcheck changes break monitoring | Medium | Keep existing checks as fallback |
| Redis auth breaks existing connections | Medium | Update all Redis clients simultaneously |
| CI workflow takes too long | Low | Use caching, parallel jobs |

---

## Notes

- The current setup works but has accumulated technical debt from iterative fixes
- Focus on critical issues first to stabilize the deployment
- Medium priority items improve reliability and security
- Low priority items enhance developer experience
- All changes should be tested in a staging environment before production
