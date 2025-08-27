FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Remove any duplicate packages
COPY . .
RUN if [ -d "packages/eslint-config" ] && [ -d "packages/config-eslint" ]; then \
      rm -rf packages/eslint-config; \
    fi && \
    if [ -d "packages/typescript-config" ] && [ -d "packages/config-typescript" ]; then \
      rm -rf packages/typescript-config; \
    fi

# Copy package files - fixed paths to match actual directory structure
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/config-eslint/package.json ./packages/config-eslint/
COPY packages/config-typescript/package.json ./packages/config-typescript/

# Install dependencies with dev dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Handle duplicate packages again in the builder stage
RUN if [ -d "packages/eslint-config" ] && [ -d "packages/config-eslint" ]; then \
      rm -rf packages/eslint-config; \
    fi && \
    if [ -d "packages/typescript-config" ] && [ -d "packages/config-typescript" ]; then \
      rm -rf packages/typescript-config; \
    fi

# Generate Prisma client with NODE_ENV=development
RUN cd packages/database && \
    NODE_ENV=development npx prisma generate

# Next.js builds can use a lot of memory
ENV NODE_OPTIONS="--max_old_space_size=4096"

# Build Next.js based on the preferred package manager
RUN npm run build --workspace=apps/web

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Set working directory to the web directory right away
WORKDIR /app/apps/web

# Make sure we have the necessary next.js files
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/next.config.js ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/package.json ./

# Copy the entire node_modules to ensure all dependencies are available
COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules

# Copy database files for direct access
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist /app/packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma /app/packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/generated /app/packages/database/generated

# Make sure logs directory exists and has proper permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start Next.js using the correct path to node_modules
CMD ["/app/node_modules/.bin/next", "start"]
