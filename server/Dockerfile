# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDeps for build)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install production-only dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy application source from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/knexfile.js ./knexfile.js

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start
CMD ["node", "src/server.js"]
