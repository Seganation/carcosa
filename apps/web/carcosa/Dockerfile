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

# Set working directory to the web directory
WORKDIR /app/apps/web/carcosa

# Make sure we have the necessary next.js files
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/next.config.mjs ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/carcosa/package.json ./

# Make sure next.js is properly installed
RUN mkdir -p /app/apps/web/carcosa/node_modules/.bin
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/next /app/apps/web/carcosa/node_modules/next
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.bin/next /app/apps/web/carcosa/node_modules/.bin/

# Create the rest of the node_modules structure
COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules

# Copy database files for direct access
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist /app/packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma /app/packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/generated /app/packages/database/generated

# Copy built packages
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/dist /app/packages/types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/sdk/dist /app/packages/sdk/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/cmage/dist /app/packages/cmage/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/ui/dist /app/packages/ui/dist

# Make sure logs directory exists and has proper permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Configure health check (Next.js doesn't have /api/health by default, so just check root)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start Next.js
CMD ["node", "node_modules/next/dist/bin/next", "start"]
