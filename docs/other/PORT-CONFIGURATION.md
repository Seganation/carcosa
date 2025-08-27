# Port Configuration

This document outlines the port configuration for all services in the Carcosa project.

## Service Ports

### Web Applications
- **Main Dashboard (Carcosa)**: `apps/web/carcosa` → **Port 3000**
- **Test App**: `apps/web/test` → **Port 3003**
- **Documentation**: `apps/docs` → **Port 3001**

### API Services
- **API Server**: `apps/api` → **Port 4000**

## Port Assignment Logic

- **3000**: Main production dashboard (Carcosa)
- **3001**: Documentation site
- **3003**: Testing environment (isolated from production)
- **4000**: API server

## Configuration Files

### Main Web App (Carcosa)
```json
// apps/web/carcosa/package.json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3000"
  }
}
```

### Test Web App
```json
// apps/web/test/package.json
{
  "scripts": {
    "dev": "next dev --port 3003"
  }
}
```

### Documentation
```json
// apps/docs/package.json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3001"
  }
}
```

### API Server
```typescript
// apps/api/src/env.ts
export const Env = z.object({
  API_PORT: z.coerce.number().default(4000),
  // ... other config
});
```

## Running Services

### Start All Services
```bash
turbo dev
```

### Start Individual Services
```bash
# Main dashboard
cd apps/web/carcosa && npm run dev

# Test app
cd apps/web/test && npm run dev

# Documentation
cd apps/docs && npm run dev

# API server
cd apps/api && npm run dev
```

## Access URLs

- **Main Dashboard**: http://localhost:3000
- **Test App**: http://localhost:3003
- **Documentation**: http://localhost:3001
- **API Server**: http://localhost:4000

## Benefits of Fixed Ports

1. **Predictable Development**: No port conflicts or random port assignments
2. **Easy Configuration**: Frontend apps can hardcode API URLs
3. **Consistent Environment**: Same ports across all development machines
4. **Simplified Testing**: Test scripts can rely on specific ports
5. **Team Collaboration**: Everyone knows which service runs on which port

