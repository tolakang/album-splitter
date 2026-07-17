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
└── main.ts         # Application entry point
```

## Environment Variables
## Environment Variables

For development:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/album_splitter
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000  # For local dev CORS
```

For production (Docker):
```bash
DATABASE_URL=postgresql://postgres:password@postgres:5432/album_splitter
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://<YOUR_DOMAIN>  # Must match actual public domain for CORS
```
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
