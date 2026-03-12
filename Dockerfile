# Multi-stage Dockerfile optimized for Railway production deployment
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source code
COPY . .

# Build frontend (build args will be passed by Railway)
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL
ARG VITE_API_TIMEOUT=30000
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT

RUN bun run build

# Production stage
FROM oven/bun:1
WORKDIR /app

# Copy dependencies and built assets
COPY --from=builder /app/package.json /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/shared ./src/shared
COPY --from=builder /app/src/lib ./src/lib

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start command (Railway will run migrations first via railway.toml)
CMD ["bun", "run", "start"]
