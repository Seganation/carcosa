Core:
- npm install
- npm run dev  # turborepo dev: web:3000 + api:4000
- npm run build
- npm run lint
- npm run check-types

API:
- npm run --workspace api dev
- npm run --workspace api build
- npm run --workspace api start
- npm run --workspace api db:push
- npm run --workspace api db:seed

Web:
- npm run --workspace web dev
- npm run --workspace web build
- npm run --workspace web start

CLI/SDK dev:
- npx @carcosa/cli init --base-url http://localhost:4000
- npx @carcosa/cli upload ./file.jpg --project <id>

Infra:
- docker compose up -d  # postgres, redis, minio
