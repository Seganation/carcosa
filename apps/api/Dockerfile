FROM node:20-alpine
WORKDIR /app

# Install sharp deps
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY ../../package*.json /app/
COPY ../../packages ./packages
COPY . .

RUN npm ci --ignore-scripts && npm run -w api build && npm prune --production

EXPOSE 4000
CMD ["node", "dist/index.js"]

