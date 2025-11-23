FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g turbo
COPY . .

# Use turbo prune with api and explicitly include database package
RUN turbo prune --scope=api --scope=@carcosa/database --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# Copy package files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma client
RUN cd packages/database && \
    npx prisma generate

# Build database package first
RUN cd packages/database && npm run build

# Build API using the proper build script
RUN cd apps/api && npm run build

FROM base AS runner
WORKDIR /app

# Install required dependencies for production
RUN apk add --no-cache wget curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Set up directory structure
RUN mkdir -p /app/prisma /app/logs && \
    chown -R nodejs:nodejs /app/logs

# Copy API files
COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/apps/api/package.json .

# Copy prisma directory (schema + migrations)
COPY --from=installer /app/packages/database/prisma ./prisma/

# Copy node_modules
COPY --from=installer /app/node_modules ./node_modules

# Copy database package components
COPY --from=installer /app/packages/database/dist ./node_modules/@carcosa/database/dist
COPY --from=installer /app/packages/database/prisma ./node_modules/@carcosa/database/prisma
COPY --from=installer /app/packages/database/package.json ./node_modules/@carcosa/database/package.json
COPY --from=installer /app/packages/database/generated ./node_modules/@carcosa/database/generated

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Use explicit node command
CMD ["node", "dist/server.js"]
