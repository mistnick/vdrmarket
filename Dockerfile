# ==============================================================================
# DataRoom VDR - Multi-Stage Production Dockerfile
# Version: 3.1.0 - GroupType-based Authorization
# Last Updated: 29 Novembre 2025
# ==============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
LABEL stage=deps

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates

WORKDIR /app

# Copy package files (leverage Docker cache)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies with optimizations
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force && \
    rm -rf /tmp/*

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
LABEL stage=builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL for Prisma generation (override at runtime)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dataroom?schema=public"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js with optimizations
RUN npm run build && \
    # Remove development dependencies to reduce size
    npm prune --omit=dev --legacy-peer-deps && \
    # Clean build artifacts
    rm -rf .next/cache && \
    rm -rf node_modules/.cache && \
    # Remove test files
    find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | xargs rm -f

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
LABEL stage=runner
LABEL maintainer="SimpleVDR Team"
LABEL description="DataRoom VDR - Virtual Data Room Platform"
LABEL version="3.1.0"

# Install runtime dependencies only
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    wget \
    dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p .next logs uploads /tmp && \
    chown -R nextjs:nodejs .next logs uploads /tmp

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy node_modules (for Prisma and other runtime dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Prisma files for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables for runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly and run entrypoint
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Start server (passed to entrypoint script)
CMD ["node", "server.js"]
