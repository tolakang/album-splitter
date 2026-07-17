FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Force a clean rebuild to avoid stale cached Server Actions
RUN rm -rf .next && npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Bind to 0.0.0.0 so the server is reachable on localhost (healthcheck) and
# on the container network (Traefik). Next.js standalone honors HOSTNAME env var.
ENV HOSTNAME=0.0.0.0

# Start application
CMD ["node", "server.js"]
