FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g turbo
COPY . .

# Handle duplicate workspace packages before running turbo prune
RUN if [ -d "packages/eslint-config" ] && [ -d "packages/config-eslint" ]; then \
      rm -rf packages/eslint-config; \
    fi && \
    if [ -d "packages/typescript-config" ] && [ -d "packages/config-typescript" ]; then \
      rm -rf packages/typescript-config; \
    fi

# Use turbo prune with api and explicitly include database package
RUN turbo prune --scope=api --scope=@repo/database --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# Copy package files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

# Fix package references if needed before installing
RUN if [ -d "packages/eslint-config" ] && [ ! -d "packages/config-eslint" ]; then \
      mkdir -p packages/config-eslint && \
      mv packages/eslint-config/* packages/config-eslint/; \
    fi && \
    if [ -d "packages/typescript-config" ] && [ ! -d "packages/config-typescript" ]; then \
      mkdir -p packages/config-typescript && \
      mv packages/typescript-config/* packages/config-typescript/; \
    fi

# Use npm install instead of npm ci to resolve missing dependencies
RUN npm install

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma client using URL-less schema generation
RUN cd packages/database && \
    npx prisma generate

# Build database package first
RUN cd packages/database && npm run build

# Build API using tsup, which better handles path aliases
RUN cd apps/api && npx tsup src/index.ts --format cjs --dts

FROM base AS runner
WORKDIR /app

# Install required dependencies for production
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Set up directory structure
RUN mkdir -p /app/prisma /app/logs && \
    chown -R nodejs:nodejs /app/logs

# Copy API files
COPY --from=installer /app/apps/api/dist .
COPY --from=installer /app/apps/api/package.json .

# Copy prisma schema
COPY --from=installer /app/packages/database/prisma/schema.prisma ./prisma/

# Copy node_modules
COPY --from=installer /app/node_modules ./node_modules

# Copy database package components
COPY --from=installer /app/packages/database/dist ./node_modules/@repo/database/dist
COPY --from=installer /app/packages/database/prisma ./node_modules/@repo/database/prisma
COPY --from=installer /app/packages/database/package.json ./node_modules/@repo/database/package.json
COPY --from=installer /app/packages/database/generated ./node_modules/@repo/database/generated

# No need to regenerate Prisma client - use the one we already generated

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use explicit node command to avoid possible path issues
CMD ["node", "index.js"]
