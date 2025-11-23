# Carcosa Deployment Guide

## 🚀 Overview

Carcosa uses a modern CI/CD pipeline with Docker, GitHub Container Registry (ghcr.io), and Coolify for deployment.

### Architecture

```
GitHub Push → GitHub Actions → Build Docker Images → Push to ghcr.io → Coolify Deploys
```

**Key Features**:
- **Sequential Deployment**: API deploys first, then Web (ensures backend is ready)
- **Smart Change Detection**: Only rebuilds what changed (api/web/packages)
- **Multi-stage Docker Builds**: Optimized for production (smaller images, faster builds)
- **Health Checks**: Automatic container health monitoring
- **Zero Downtime**: Rolling deployments via Coolify

---

## 📦 Docker Setup

### Local Development

Start all services (PostgreSQL, Redis, MinIO):

```bash
docker compose up -d
```

Services:
- **PostgreSQL**: `localhost:5432` (user: postgres, password: password)
- **Redis**: `localhost:6379`
- **MinIO**: `localhost:9000` (console: `localhost:9001`, user/pass: minioadmin)

### Docker Images

Two production images are built:
1. **API**: `ghcr.io/seganation/carcosa-api:latest`
2. **Web**: `ghcr.io/seganation/carcosa-web:latest`

### Image Characteristics

**API Image**:
- Base: `node:18-alpine`
- Size: ~200-300 MB
- Port: 4000
- Health Check: `GET /health`
- Entry Point: `node dist/server.js`

**Web Image**:
- Base: `node:18-alpine`
- Size: ~300-400 MB
- Port: 3000
- Health Check: `GET /api/health`
- Entry Point: `next start`

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Jobs**:
1. **changes**: Detects which files changed (api/web/packages)
2. **api-deploy**: Builds and deploys API (if changed)
3. **web-deploy**: Builds and deploys Web (if changed, runs after API)

### Workflow Features

**Change Detection**:
```yaml
api:
  - 'apps/api/**'
web:
  - 'apps/web/carcosa/**'
packages:
  - 'packages/**'
```

**Force Deploy Options**:
- `false`: Deploy only if files changed (default)
- `true`: Force deploy both API and Web
- `api-only`: Force deploy API only
- `web-only`: Force deploy Web only

**Sequential Execution**:
- API deploys first
- Web waits for API to complete
- Ensures backend is ready before frontend

---

## 🔐 GitHub Secrets Required

Configure these secrets in your GitHub repository:

### Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `COOLIFY_API_WEBHOOK_URL` | Coolify webhook for API deployment | `https://coolify.yourdomain.com/api/v1/deploy/...` |
| `COOLIFY_WEB_WEBHOOK_URL` | Coolify webhook for Web deployment | `https://coolify.yourdomain.com/api/v1/deploy/...` |
| `NEXT_PUBLIC_API_URL` | API URL for web app | `https://api.carcosa.yourdomain.com` |

### How to Get Coolify Webhooks

1. Log in to Coolify dashboard
2. Go to your API service → Settings → Webhooks
3. Copy the webhook URL
4. Add to GitHub Secrets as `COOLIFY_API_WEBHOOK_URL`
5. Repeat for Web service → `COOLIFY_WEB_WEBHOOK_URL`

---

## 🎯 Deployment Process

### Automatic Deployment (on push to main)

1. **Push to main branch**:
   ```bash
   git push origin main
   ```

2. **GitHub Actions automatically**:
   - Detects changed files
   - Builds Docker images for changed apps
   - Pushes to GitHub Container Registry
   - Triggers Coolify webhooks
   - Coolify pulls and deploys new images

3. **Monitor deployment**:
   - GitHub Actions: `https://github.com/your-repo/actions`
   - Coolify: Your Coolify dashboard

### Manual Deployment

Trigger via GitHub Actions UI:

1. Go to `Actions` tab in GitHub
2. Select `Sequential Build and Deploy`
3. Click `Run workflow`
4. Choose force deploy option:
   - Deploy both API and Web
   - Deploy API only
   - Deploy Web only

---

## 🛠️ Coolify Configuration

### API Service

**Image**: `ghcr.io/seganation/carcosa-api:latest`

**Environment Variables**:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@postgres:5432/carcosa
REDIS_URL=redis://redis:6379
ENCRYPTION_KEY=your-32-byte-hex-key
API_URL=https://api.carcosa.yourdomain.com
NEXTAUTH_SECRET=your-secret-here
```

**Port Mapping**: `4000:4000`

**Health Check**: `GET /health` (interval: 30s, timeout: 5s)

**Restart Policy**: `unless-stopped`

### Web Service

**Image**: `ghcr.io/seganation/carcosa-web:latest`

**Environment Variables**:
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://api.carcosa.yourdomain.com
NEXTAUTH_URL=https://carcosa.yourdomain.com
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=postgresql://user:password@postgres:5432/carcosa
```

**Port Mapping**: `3000:3000`

**Health Check**: `GET /api/health` (interval: 30s, timeout: 5s)

**Restart Policy**: `unless-stopped`

### Database Service (PostgreSQL)

**Image**: `postgres:16`

**Environment Variables**:
```env
POSTGRES_USER=carcosa
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=carcosa
```

**Port Mapping**: `5432:5432` (internal only, not exposed publicly)

**Volume**: Persistent volume for `/var/lib/postgresql/data`

---

## 📊 Monitoring

### Health Checks

**API Health Endpoint**:
```bash
curl https://api.carcosa.yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T12:00:00.000Z"
}
```

**Web Health Endpoint**:
```bash
curl https://carcosa.yourdomain.com/api/health
```

### Coolify Dashboard

Monitor:
- Container status (running/stopped)
- Resource usage (CPU, memory)
- Logs (stdout/stderr)
- Deployment history
- Health check status

### GitHub Actions Logs

View detailed build logs:
1. Go to `Actions` tab
2. Click on latest workflow run
3. Expand jobs to see detailed logs

---

## 🚨 Troubleshooting

### Build Failures

**Problem**: Docker build fails

**Solutions**:
1. Check GitHub Actions logs for errors
2. Verify all dependencies are installed
3. Check Turbo cache (may need to clear)
4. Verify Prisma client generation succeeds

**Clear cache and rebuild**:
```bash
# Local
npm run clean
npm install
npm run build

# GitHub Actions: Re-run workflow
```

### Deployment Failures

**Problem**: Coolify webhook fails

**Solutions**:
1. Verify webhook URL in GitHub Secrets
2. Check Coolify service status
3. Verify image was pushed to ghcr.io
4. Check Coolify logs for errors

### Health Check Failures

**Problem**: Container health check failing

**API Solutions**:
1. Check `/health` endpoint returns 200
2. Verify port 4000 is exposed
3. Check database connection
4. Review container logs

**Web Solutions**:
1. Check `/api/health` endpoint exists
2. Verify Next.js is running
3. Check environment variables
4. Review container logs

### Database Connection Issues

**Problem**: Cannot connect to database

**Solutions**:
1. Verify `DATABASE_URL` environment variable
2. Check PostgreSQL service is running
3. Verify network connectivity between containers
4. Check database credentials
5. Run migrations: `npm run --workspace @carcosa/database db:deploy`

---

## 🔐 Security Best Practices

### Secrets Management

1. **Never commit secrets** to repository
2. **Use GitHub Secrets** for CI/CD variables
3. **Rotate credentials** regularly
4. **Use strong passwords** for database, encryption keys

### Image Security

1. **Non-root user**: All containers run as `nodejs` user (uid 1001)
2. **Minimal base image**: Alpine Linux (small attack surface)
3. **Multi-stage builds**: Separate build and runtime environments
4. **No dev dependencies**: Production images contain only runtime dependencies

### Network Security

1. **Internal network**: Database not exposed publicly
2. **HTTPS only**: Use Coolify's automatic SSL/TLS
3. **Rate limiting**: Enabled by default (see RATE-LIMITING.md)
4. **API key permissions**: Granular access control (see API-KEY-PERMISSIONS.md)

---

## 📈 Performance Optimization

### Docker Build Cache

GitHub Actions uses layer caching:
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

**Benefits**:
- Faster builds (reuses unchanged layers)
- Reduced bandwidth usage
- Lower build times (2-5 minutes typical)

### Image Size Optimization

**Techniques Used**:
1. Multi-stage builds (separate build/runtime)
2. Alpine Linux base (smaller than full Node image)
3. .dockerignore (excludes unnecessary files)
4. Pruned dependencies (production only)

**Size Comparison**:
- Build stage: ~1.5 GB
- Runtime stage: ~200-400 MB (75% reduction)

### Database Migrations

**Production Deployment**:
```bash
# Run migrations during deployment
npm run --workspace @carcosa/database db:deploy
```

**Coolify Integration**:
Add migration step to deployment command:
```bash
npm run db:deploy && node dist/server.js
```

---

## 🎯 Rollback Procedure

### Via Coolify

1. Go to service → Deployments
2. Find previous successful deployment
3. Click "Redeploy"
4. Confirm rollback

### Via GitHub Actions

1. Find last working commit
2. Create rollback branch:
   ```bash
   git checkout -b rollback/fix
   git reset --hard <last-good-commit>
   git push origin rollback/fix --force
   ```
3. Merge to main to trigger deployment

### Manual Rollback

1. Pull previous image:
   ```bash
   docker pull ghcr.io/seganation/carcosa-api:<previous-tag>
   ```
2. Update Coolify to use previous tag
3. Redeploy

---

## 📚 Related Documentation

- **API Key Permissions**: `API-KEY-PERMISSIONS.md`
- **Rate Limiting**: `RATE-LIMITING.md`
- **Database Optimization**: `DATABASE-OPTIMIZATION.md`
- **Project Roadmap**: `ROADMAP.md`

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] Database migrations created and tested
- [ ] Environment variables configured in Coolify
- [ ] GitHub Secrets configured
- [ ] Coolify webhooks tested
- [ ] Health endpoints return 200
- [ ] SSL/TLS certificates configured
- [ ] Domain DNS configured
- [ ] Rate limiting configured
- [ ] API keys generated for services
- [ ] Backup strategy in place
- [ ] Monitoring dashboards set up

---

**Status**: ✅ Docker and CI/CD setup complete
**Container Registry**: GitHub Container Registry (ghcr.io)
**Deployment Platform**: Coolify
**Sequential Deployment**: API → Web (zero downtime)
