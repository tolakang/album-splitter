# Album Splitter Backend

NestJS backend API for Album Splitter.

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## API Documentation

Swagger documentation available at: `http://localhost:3001/api/docs`

## Project Structure

```
src/
├── album/          # Album CRUD operations
├── upload/         # File upload handling
├── split/          # Audio splitting logic
├── download/       # File downloads
├── cleanup/        # Auto-expiration
├── queue/          # BullMQ job management
├── prisma/         # Database service
├── config/         # Configuration and validation
│   └── env.ts      # Zod validation schema
└── main.ts         # Application entry point
```

## Environment Variables

### Development
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/album_splitter
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=changeme
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Production (Docker)
```bash
DATABASE_URL=postgresql://postgres:password@postgres:5432/album_splitter
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeme
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://<YOUR_DOMAIN>
```

## Environment Validation

The backend uses Zod to validate environment variables at startup. If required variables are missing, the application will fail to start with a clear error message.

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_PASSWORD`: Redis authentication password

## Scripts

```bash
npm run start:dev      # Development server
npm run build          # Build for production
npm run start:prod     # Production server
npm run worker         # Start background worker
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio
```

## Docker

The backend uses a multi-stage Dockerfile for optimized builds:

1. **deps stage**: Installs production dependencies only
2. **builder stage**: Installs all dependencies and builds the application
3. **runner stage**: Copies production dependencies and built artifacts

The entrypoint script:
- Runs Prisma migrations (only for API server, not worker)
- Generates Prisma client
- Starts the application or custom command
