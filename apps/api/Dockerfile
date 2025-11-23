FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g turbo
COPY . .

# Use turbo prune with api scope
RUN turbo prune --scope=api --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
# Install build dependencies for sharp and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    fftw-dev \
    gettext-dev \
    lcms2-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    tiff-dev \
    giflib-dev \
    libxml2-dev \
    librsvg-dev \
    libexif-dev
WORKDIR /app

# Copy package files from pruned output
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

# Install ALL dependencies (including sharp with proper native builds)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy source code from pruned output
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma client FIRST (needed by database package)
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build all packages in correct dependency order
RUN npm run build --workspace=@carcosa/database
RUN npm run build --workspace=@carcosa/types
RUN npm run build --workspace=@carcosa/storage
RUN npm run build --workspace=@carcosa/file-router
RUN npm run build --workspace=api

FROM base AS runner
WORKDIR /app

# Install ALL runtime dependencies for sharp and other native modules
RUN apk add --no-cache \
    wget \
    curl \
    vips \
    fftw \
    gettext \
    lcms2 \
    libpng \
    libjpeg-turbo \
    libwebp \
    tiff \
    giflib \
    libxml2 \
    librsvg \
    libexif

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy root package.json for workspace resolution FIRST
COPY --from=installer --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=installer --chown=nodejs:nodejs /app/package-lock.json ./package-lock.json

# Copy complete node_modules with all dependencies (including sharp)
COPY --from=installer --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy API application
COPY --from=installer --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=installer --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/package.json

# Copy package structure for workspace packages
COPY --from=installer --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=installer --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=installer --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma

COPY --from=installer --chown=nodejs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=installer --chown=nodejs:nodejs /app/packages/types/package.json ./packages/types/package.json

COPY --from=installer --chown=nodejs:nodejs /app/packages/storage/dist ./packages/storage/dist
COPY --from=installer --chown=nodejs:nodejs /app/packages/storage/package.json ./packages/storage/package.json

COPY --from=installer --chown=nodejs:nodejs /app/packages/file-router/dist ./packages/file-router/dist
COPY --from=installer --chown=nodejs:nodejs /app/packages/file-router/package.json ./packages/file-router/package.json

# Create logs directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Create a symlink from apps/api/node_modules to the root node_modules for module resolution
RUN ln -sf /app/node_modules /app/apps/api/node_modules && chown -h nodejs:nodejs /app/apps/api/node_modules

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Use explicit node command with correct path
CMD ["node", "apps/api/dist/server.js"]
