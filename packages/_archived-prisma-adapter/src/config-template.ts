/**
 * Configuration template for Carcosa tenant integration
 * Copy this file to your project and customize as needed
 */

export const carcosaConfig = {
  // Your Carcosa project credentials
  projectId: process.env.CARCOSA_PROJECT_ID || 'your-project-id',
  apiKey: process.env.CARCOSA_API_KEY || 'your-api-key',
  apiUrl: process.env.CARCOSA_API_URL || 'https://api.carcosa.dev',
  
  // Sync configuration
  autoSync: process.env.CARCOSA_AUTO_SYNC === 'true',
  syncInterval: parseInt(process.env.CARCOSA_SYNC_INTERVAL || '300000'), // 5 minutes
  
  // Tenant detection configuration
  tenantDetection: {
    // Enable subdomain-based detection (e.g., customer.app.com)
    subdomain: true,
    
    // Enable header-based detection
    headers: ['x-tenant-slug', 'x-tenant-id'],
    
    // Custom tenant detection function
    custom: (req: any) => {
      // Example: detect from query params
      return req.query.tenant || req.body.tenant;
    }
  },
  
  // Database configuration
  database: {
    // Your tenant table name
    tableName: 'tenants',
    
    // Field mappings (if different from default)
    fields: {
      carcosaId: 'carcosa_id',
      slug: 'slug',
      metadata: 'metadata',
      lastSynced: 'last_synced'
    }
  }
};

// Environment variables to add to your .env file:
/*
CARCOSA_PROJECT_ID=your-project-id
CARCOSA_API_KEY=your-api-key
CARCOSA_API_URL=https://api.carcosa.dev
CARCOSA_AUTO_SYNC=true
CARCOSA_SYNC_INTERVAL=300000
*/
