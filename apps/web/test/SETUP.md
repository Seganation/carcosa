# Test App Setup Guide

This guide will help you set up the test app to work with your Carcosa SDK.

## Step 1: Create Environment File

Create a `.env.local` file in the `apps/web/test/` directory with the following content:

```bash
# Carcosa Test App Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_PROJECT_ID=your_actual_project_id_here

# Optional: Tenant ID if you're using multi-tenancy
# NEXT_PUBLIC_TENANT_ID=your_tenant_id_here
```

## Step 2: Get Your API Key and Project ID

1. **Go to your Carcosa dashboard** at http://localhost:3000
2. **Create a new app** or use an existing one
3. **Go to the API Keys section** of your app
4. **Copy the API key** (it looks like: `carcosa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
5. **Copy the Project ID** from the app settings

## Step 3: Install Dependencies

The test app already has `@carcosa/sdk` as a dependency. Run:

```bash
cd apps/web/test
npm install
```

## Step 4: Test the Upload

1. **Start the test app**: `npm run dev` (runs on port 3003)
2. **Open** http://localhost:3003
3. **Select a file** to upload
4. **Click Upload** to test the integration

## Step 5: Replace Mock Client (Optional)

Once you're ready to test with the real SDK, uncomment this line in `src/app/page.tsx`:

```typescript
import { CarcosaClient } from "@carcosa/sdk";
```

And replace the `mockClient` with:

```typescript
const client = new CarcosaClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
});

// Then use: client.uploadFile(projectId, file)
```

## Troubleshooting

### Port Conflicts
- Make sure ports 3000, 3001, 3003, and 4000 are available
- Use `turbo dev` to start all services together

### API Key Issues
- Ensure your API key is valid and has upload permissions
- Check that the project ID matches your app

### CORS Issues
- The API should be configured to allow requests from localhost:3003
- Check the API server logs for CORS errors
