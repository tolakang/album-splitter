FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma/

# Create storage directory
RUN mkdir -p /app/storage/uploads /app/storage/generated /app/storage/temp /app/storage/thumbnails /app/storage/logs

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main.js"]
