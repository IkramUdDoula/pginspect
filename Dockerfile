# Single-stage Dockerfile with hot reloading support
FROM oven/bun:1
WORKDIR /app

# Build arguments for Vite
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL=http://localhost:3000
ARG VITE_API_TIMEOUT=30000

# Set as environment variables
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV PORT=3000

# Copy package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install

# Copy source code (this will be overridden by volume mounts in development)
COPY . .

# Build frontend initially
RUN bun run build

EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Use development command that includes hot reloading
CMD ["bun", "run", "dev"]
