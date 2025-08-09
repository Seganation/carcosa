FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY ../../package*.json /app/
COPY ../../packages ./packages
COPY . .
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app /app
RUN npm run -w web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

