# Multi-stage Dockerfile for monorepo deployment

# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

# Stage 2: Build frontend
FROM oven/bun:1 AS builder
WORKDIR /app

# Build arguments for Vite
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL=http://localhost:3000
ARG VITE_API_TIMEOUT=30000

# Set as environment variables for build
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT

COPY package.json bun.lockb ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the frontend
RUN bun run build

# Stage 3: Production runtime
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/shared ./src/shared
COPY --from=builder /app/src/lib/connectionParser.ts ./src/lib/connectionParser.ts
COPY --from=builder /app/src/lib/encryption.ts ./src/lib/encryption.ts
COPY --from=builder /app/package.json ./

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["bun", "run", "start"]
