import { Request, Response, NextFunction } from 'express';
import { CarcosaTenantAdapter, TenantContext } from './tenant-adapter';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

/**
 * Express middleware for tenant detection
 */
export function carcosaTenantMiddleware(adapter: CarcosaTenantAdapter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await adapter.getTenantFromRequest(req);
      if (tenant) {
        req.tenant = tenant;
      }
      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      next(); // Continue without tenant context
    }
  };
}

/**
 * Middleware that requires tenant context
 */
export function requireTenant() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'tenant_required',
        message: 'Tenant context is required for this endpoint'
      });
    }
    next();
  };
}

/**
 * Middleware that makes tenant optional but provides helper methods
 */
export function withTenant() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add helper methods to response
    res.locals.hasTenant = !!req.tenant;
    res.locals.tenantSlug = req.tenant?.tenantSlug;
    res.locals.tenantId = req.tenant?.tenantId;
    
    next();
  };
}
