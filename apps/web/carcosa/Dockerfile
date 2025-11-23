FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files FIRST (before source code)
COPY package.json package-lock.json* ./
COPY apps/web/carcosa/package.json ./apps/web/carcosa/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/storage/package.json ./packages/storage/
COPY packages/file-router/package.json ./packages/file-router/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/cmage/package.json ./packages/cmage/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build database package
RUN cd packages/database && \
    NODE_ENV=development npx prisma generate && \
    npm run build

# Build other packages that web depends on
RUN cd packages/types && npm run build
RUN cd packages/storage && npm run build
RUN cd packages/file-router && npm run build
RUN cd packages/sdk && npm run build
RUN cd packages/cmage && npm run build
RUN cd packages/ui && npm run build

# Next.js builds can use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=4096"

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Version variables (passed from GitHub Actions)
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_BUILD_TIME
ARG NEXT_PUBLIC_COMMIT_SHA
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME
ENV NEXT_PUBLIC_COMMIT_SHA=$NEXT_PUBLIC_COMMIT_SHA

# Build Next.js
RUN npm run build --workspace=apps/web/carcosa

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy the standalone output from Next.js build
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/.next/static ./apps/web/carcosa/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/public ./apps/web/carcosa/public

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start Next.js standalone server
CMD ["node", "apps/web/carcosa/server.js"]
