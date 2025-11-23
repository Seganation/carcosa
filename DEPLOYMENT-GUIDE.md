# Beta Deployment Guide 🚀

## Overview

This guide covers deploying Carcosa to production using GitHub Container Registry (GHCR) and GitHub Actions.

## Architecture

```
GitHub Actions → Build → GHCR → Deploy to Server
     ↓              ↓        ↓
  Trigger     Docker Build   ↓
                             ghcr.io/seganation/carcosa-api:latest
                             ghcr.io/seganation/carcosa-web:latest
```

## Prerequisites

### 1. GitHub Secrets Required

Add these secrets in your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

```bash
# Required for deployment webhooks (if using Coolify or similar)
COOLIFY_API_WEBHOOK_URL    # Your API deployment webhook
COOLIFY_WEB_WEBHOOK_URL    # Your Web deployment webhook

# Required for Next.js build
NEXT_PUBLIC_API_URL        # Your production API URL (e.g., https://api.carcosa.io)

# Note: GITHUB_TOKEN is automatically provided by GitHub Actions
```

### 2. GHCR Permissions

GHCR is automatically enabled for your repository. The workflow uses `GITHUB_TOKEN` which has:

- ✅ Read access to your repository
- ✅ Write access to GitHub Packages (GHCR)

## Workflows

### Main Workflow: `deploy.yml` (RECOMMENDED)

**Purpose**: Production deployment to GHCR with smart path-based triggers

**Triggers:**

- Push to `main` branch (auto-detects changed files)
- Manual dispatch with force deploy options

**Features:**

- ✅ Smart path detection (only builds what changed)
- ✅ Sequential deployment (API first, then Web)
- ✅ Multi-architecture support (amd64, arm64)
- ✅ Build caching for faster builds
- ✅ Automatic image tagging (latest, SHA, branch)
- ✅ Health checks built into containers
- ✅ Coolify webhook integration (optional)

**Image Names:**

```
API:  ghcr.io/seganation/carcosa-api:latest
Web:  ghcr.io/seganation/carcosa-web:latest
```

**Tags Generated:**

```
latest                    # Latest from main branch
main                      # Branch-based tag
main-abc123def            # Branch + commit SHA
pr-123                    # Pull request number
```

### Legacy Workflows: `api.yml` and `web.yml`

**Status**: ⚠️ These use Coolify registry instead of GHCR

**Recommendation**:

- **Delete these files** if you want to use GHCR exclusively
- **OR** update them to use GHCR (see "Option 2" below)

## Deployment Options

### Option 1: Use Only `deploy.yml` (RECOMMENDED) ✅

This is the cleanest approach:

1. **Delete old workflows:**

```bash
rm .github/workflows/api.yml
rm .github/workflows/web.yml
```

2. **Use `deploy.yml` for everything:**

```bash
# Push to main (auto-deploys changed services)
git push origin main

# Or manually trigger from GitHub UI
# Actions → Production Deploy (GHCR) → Run workflow
```

3. **Force deploy both services:**

```bash
# Via GitHub UI: select "force_deploy: true"
# Or use GitHub CLI:
gh workflow run deploy.yml -f force_deploy=true
```

### Option 2: Keep Separate Workflows (Update for GHCR)

If you prefer separate workflows for API and Web:

**Update `api.yml`:**

```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and Push
  run: |
    docker build -t ghcr.io/${{ github.repository }}-api:latest -f ./apps/api/Dockerfile .
    docker push ghcr.io/${{ github.repository }}-api:latest
```

**Update `web.yml`:**

```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and Push
  run: |
    docker build -t ghcr.io/${{ github.repository }}-web:latest -f ./apps/web/carcosa/Dockerfile .
    docker push ghcr.io/${{ github.repository }}-web:latest
```

## Docker Images on GHCR

### Viewing Your Images

After first deployment, images will be available at:

```
https://github.com/orgs/Seganation/packages?repo_name=carcosa
```

Or direct links:

```
https://github.com/Seganation/carcosa/pkgs/container/carcosa-api
https://github.com/Seganation/carcosa/pkgs/container/carcosa-web
```

### Making Images Public

By default, GHCR images are private. To make them public:

1. Go to package page
2. Click "Package settings"
3. Scroll to "Danger Zone"
4. Click "Change visibility" → "Public"

## Pulling Images

### For Deployment Server

```bash
# Login to GHCR (one-time setup)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/seganation/carcosa-api:latest
docker pull ghcr.io/seganation/carcosa-web:latest

# Run containers
docker run -d \
  --name carcosa-api \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  ghcr.io/seganation/carcosa-api:latest

docker run -d \
  --name carcosa-web \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="https://api.carcosa.io" \
  ghcr.io/seganation/carcosa-web:latest
```

### Docker Compose (Recommended)

Create `docker-compose.prod.yml` on your server:

```yaml
version: "3.9"

services:
  api:
    image: ghcr.io/seganation/carcosa-api:latest
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      CREDENTIALS_ENCRYPTION_KEY: ${CREDENTIALS_ENCRYPTION_KEY}
    depends_on:
      - postgres
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:4000/health",
        ]
      interval: 30s
      timeout: 5s
      retries: 3

  web:
    image: ghcr.io/seganation/carcosa-web:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    depends_on:
      - api
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:3000/",
        ]
      interval: 30s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-carcosa}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

Deploy:

```bash
# Create .env file with secrets
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@postgres:5432/carcosa
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CREDENTIALS_ENCRYPTION_KEY=base64:YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=
NEXT_PUBLIC_API_URL=https://api.carcosa.io
POSTGRES_PASSWORD=super-secure-password
EOF

# Deploy
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:4000/health
curl http://localhost:3000/
```

## Environment Variables

### API Container

**Required:**

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CREDENTIALS_ENCRYPTION_KEY=base64:YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=
```

**Optional:**

```bash
PORT=4000
REDIS_URL=redis://localhost:6379
API_RATE_LIMIT_MAX=100
API_RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=info
```

### Web Container

**Required:**

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.carcosa.io
```

**Optional:**

```bash
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

## Database Migrations

Before first deployment, run migrations:

```bash
# On your server or via docker
docker run --rm \
  -e DATABASE_URL="postgresql://..." \
  ghcr.io/seganation/carcosa-api:latest \
  node -e "require('@carcosa/database').prisma.migrate.deploy()"

# Or connect to running container
docker exec carcosa-api sh -c "cd /app && npx prisma migrate deploy"
```

## Monitoring

### Health Checks

Built-in health checks are configured in both containers:

**API:**

```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Web:**

```bash
curl http://localhost:3000/
# Should return: 200 OK with HTML
```

### Container Status

```bash
# Check running containers
docker ps

# Check health status
docker inspect carcosa-api | grep -A 5 Health
docker inspect carcosa-web | grep -A 5 Health

# View logs
docker logs -f carcosa-api
docker logs -f carcosa-web
```

### Resource Usage

```bash
# Check resource usage
docker stats carcosa-api carcosa-web

# Expected usage:
# API:  ~100-300MB RAM, <5% CPU (idle)
# Web:  ~200-400MB RAM, <5% CPU (idle)
```

## Troubleshooting

### Build Failures

**Issue**: Docker build fails with memory error

```bash
# Solution: Increase Node memory limit (already set in Dockerfile)
ENV NODE_OPTIONS="--max_old_space_size=4096"
```

**Issue**: Turbo prune fails

```bash
# Solution: Check turbo.json is present and valid
# Already fixed in API Dockerfile
```

### Deployment Failures

**Issue**: Can't pull from GHCR

```bash
# Solution: Login with personal access token
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or create a PAT with read:packages scope
```

**Issue**: Container exits immediately

```bash
# Check logs
docker logs carcosa-api

# Common causes:
# 1. Missing DATABASE_URL
# 2. Can't connect to database
# 3. Missing JWT_SECRET
```

### Runtime Issues

**Issue**: API returns 500 errors

```bash
# Check database connection
docker exec carcosa-api sh -c "npx prisma db pull"

# Check environment variables
docker exec carcosa-api env | grep DATABASE_URL
```

**Issue**: Web can't reach API

```bash
# Check NEXT_PUBLIC_API_URL is correct
docker exec carcosa-web env | grep NEXT_PUBLIC_API_URL

# Test API from web container
docker exec carcosa-web wget -O- http://api:4000/health
```

## CI/CD Flow

### Automatic Deployment

1. **Developer pushes to main**

```bash
git push origin main
```

2. **GitHub Actions triggers**

- Detects changed files (apps/api or apps/web or packages)
- Builds only what changed
- Pushes to GHCR
- Triggers deployment webhook (if configured)

3. **Server pulls and restarts**

```bash
# If using Coolify (automatic via webhook)
# Or manually:
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Via GitHub UI
1. Go to Actions tab
2. Click "Production Deploy (GHCR)"
3. Click "Run workflow"
4. Select force_deploy option:
   - false: Only deploy what changed
   - true: Deploy both API and Web
   - api-only: Deploy only API
   - web-only: Deploy only Web

# Via GitHub CLI
gh workflow run deploy.yml -f force_deploy=true
```

## Rollback

### To Previous Version

```bash
# List available tags
docker images ghcr.io/seganation/carcosa-api

# Pull specific version
docker pull ghcr.io/seganation/carcosa-api:main-abc123def

# Update docker-compose
services:
  api:
    image: ghcr.io/seganation/carcosa-api:main-abc123def  # Specific tag

# Restart
docker compose -f docker-compose.prod.yml up -d
```

### Emergency Rollback

```bash
# Quick rollback to previous image
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

## Security Best Practices

### 1. Use Secrets Management

```bash
# Never commit .env files
# Use secure secrets management:
# - Coolify secrets
# - GitHub Actions secrets
# - Kubernetes secrets
# - HashiCorp Vault
```

### 2. Rotate Credentials

```bash
# Regularly rotate:
# - JWT_SECRET
# - DATABASE_URL password
# - CREDENTIALS_ENCRYPTION_KEY
# - GitHub personal access tokens
```

### 3. Network Security

```bash
# Use reverse proxy (Nginx/Caddy)
# Enable HTTPS
# Restrict database access
# Use firewall rules
```

### 4. Image Security

```bash
# Scan images for vulnerabilities
docker scan ghcr.io/seganation/carcosa-api:latest

# Keep base images updated
# Currently using: node:18-alpine (update regularly)
```

## Performance Optimization

### 1. Build Caching

Already enabled in workflows:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### 2. Multi-Stage Builds

Already implemented - reduces final image size:

```
Builder stage: ~1.5GB
Final image:   ~350MB (API), ~500MB (Web)
```

### 3. Resource Limits

Add to docker-compose.prod.yml:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

## Next Steps

### 1. Set Up Monitoring

- [ ] Add Sentry for error tracking
- [ ] Set up uptime monitoring (Uptime Robot, Pingdom)
- [ ] Configure log aggregation (Loki, DataDog)
- [ ] Set up performance monitoring (APM)

### 2. Set Up Backups

- [ ] Database backups (daily)
- [ ] Volume backups
- [ ] Disaster recovery plan

### 3. Load Testing

- [ ] Test with k6 or Artillery
- [ ] Verify auto-scaling works
- [ ] Check resource usage under load

### 4. Documentation

- [ ] API documentation (Swagger)
- [ ] User guides
- [ ] Admin guides

## Support

### Getting Help

- **GitHub Issues**: https://github.com/Seganation/carcosa/issues
- **Documentation**: https://docs.carcosa.io (if available)
- **Community**: Discord/Slack (if available)

### Reporting Bugs

Include:

- Container logs
- Environment variables (redacted)
- Steps to reproduce
- Expected vs actual behavior

---

## Summary

**Current Status**: ✅ Ready for beta deployment

**What's Working:**

- ✅ Multi-stage Docker builds
- ✅ GHCR integration
- ✅ Smart CI/CD with path detection
- ✅ Health checks
- ✅ Sequential deployment
- ✅ Build caching

**What to Do:**

1. Delete `api.yml` and `web.yml` (use only `deploy.yml`)
2. Add GitHub secrets
3. Push to main or manually trigger workflow
4. Pull images on server and run with docker-compose

**Images Will Be At:**

```
ghcr.io/seganation/carcosa-api:latest
ghcr.io/seganation/carcosa-web:latest
```

🚀 **Ready to deploy!**
