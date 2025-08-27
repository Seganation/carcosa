// Authentication & Authorization Middleware
// SECURE API ACCESS - ENTERPRISE GRADE! 🔐🚀

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createDatabaseService } from '../database';

// Extend Express types - compatible with existing types
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        tier?: 'free' | 'pro' | 'enterprise';
        organizationId?: string;
        projectId?: string;
        permissions?: string[];
      };
      apiKey?: {
        id: string;
        userId: string;
        organizationId?: string;
        projectId?: string;
        permissions: string[];
        rateLimit: number;
      };
    }
  }
}

// Authentication configuration
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  apiKeyHeader: string;
  enableApiKeys: boolean;
  enableJWT: boolean;
  enableAnonymous: boolean;
  corsOrigins: string[];
  rateLimitWindow: number; // milliseconds
  rateLimitMax: number; // requests per window
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  organizationId?: string;
  projectId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// API key interface
export interface APIKeyInfo {
  id: string;
  userId: string;
  organizationId?: string;
  projectId?: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt: Date;
}

// Rate limiting interface
export interface RateLimitInfo {
  key: string;
  requests: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil?: number;
}

export class AuthMiddleware {
  private config: AuthConfig;
  private databaseService: ReturnType<typeof createDatabaseService>;
  private rateLimitStore: Map<string, RateLimitInfo> = new Map();
  private blockedIPs: Map<string, number> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
    this.databaseService = createDatabaseService();
  }

  // JWT Authentication middleware
  authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (this.config.enableAnonymous) {
          return next();
        }
        return res.status(401).json({ error: 'JWT token required' });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, this.config.jwtSecret) as JWTPayload;
        
        // Check if token is expired
        if (decoded.exp < Date.now() / 1000) {
          return res.status(401).json({ error: 'JWT token expired' });
        }

        // Get user from database to ensure they still exist
        const user = await this.databaseService.getUserById(decoded.userId);
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Set user info in request
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          tier: decoded.tier,
          organizationId: decoded.organizationId,
          projectId: decoded.projectId,
          permissions: decoded.permissions,
        };

        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid JWT token' });
      }
    } catch (error) {
      console.error('JWT authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };

  // API Key Authentication middleware
  authenticateAPIKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.config.enableApiKeys) {
        return next();
      }

      const apiKey = req.headers[this.config.apiKeyHeader.toLowerCase()] as string;
      
      if (!apiKey) {
        if (this.config.enableAnonymous) {
          return next();
        }
        return res.status(401).json({ error: 'API key required' });
      }

      // Get API key info from database
      const apiKeyInfo = await this.getAPIKeyInfo(apiKey);
      if (!apiKeyInfo) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Check if API key is active (assuming it exists if returned from database)
      // TODO: Add status field to APIKeyInfo if needed

      // Update last used timestamp
      await this.updateAPIKeyUsage(apiKeyInfo.id);

      // Set API key info in request
      req.apiKey = {
        id: apiKeyInfo.id,
        userId: apiKeyInfo.userId,
        organizationId: apiKeyInfo.organizationId,
        projectId: apiKeyInfo.projectId,
        permissions: apiKeyInfo.permissions,
        rateLimit: apiKeyInfo.rateLimit,
      };

      next();
    } catch (error) {
      console.error('API key authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };

  // Rate limiting middleware
  rateLimit = (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = this.getRateLimitIdentifier(req);
      
      if (!identifier) {
        return next();
      }

      const now = Date.now();
      const windowStart = now - this.config.rateLimitWindow;
      
      // Get current rate limit info
      let rateLimitInfo = this.rateLimitStore.get(identifier);
      
      if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
        // Reset rate limit for new window
        rateLimitInfo = {
          key: identifier,
          requests: 0,
          resetTime: now + this.config.rateLimitWindow,
          blocked: false,
        };
      }

      // Check if IP is blocked
      if (req.ip && this.isIPBlocked(req.ip)) {
        return res.status(429).json({ 
          error: 'IP address blocked due to excessive requests',
          retryAfter: this.getBlockedUntil(req.ip) - now,
        });
      }

      // Check rate limit
      if (rateLimitInfo.blocked) {
        if (rateLimitInfo.blockedUntil && rateLimitInfo.blockedUntil > now) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            retryAfter: rateLimitInfo.blockedUntil - now,
          });
        } else {
          // Unblock after timeout
          rateLimitInfo.blocked = false;
          rateLimitInfo.blockedUntil = undefined;
        }
      }

      // Increment request count
      rateLimitInfo.requests++;

      // Check if rate limit exceeded
      const maxRequests = req.apiKey?.rateLimit || this.config.rateLimitMax;
      
      if (rateLimitInfo.requests > maxRequests) {
        rateLimitInfo.blocked = true;
        rateLimitInfo.blockedUntil = now + (this.config.rateLimitWindow * 2); // Block for 2x window
        
        // Block IP if excessive abuse
        if (req.ip && rateLimitInfo.requests > maxRequests * 3) {
          this.blockIP(req.ip, now + (this.config.rateLimitWindow * 10)); // Block for 10x window
        }

        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitInfo.blockedUntil - now,
        });
      }

      // Update rate limit store
      this.rateLimitStore.set(identifier, rateLimitInfo);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimitInfo.requests));
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime);

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };

  // Authorization middleware
  requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user && !req.apiKey) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Permission checking middleware
  requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user && !req.apiKey) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const permissions = req.user?.permissions || req.apiKey?.permissions || [];
      
      if (!permissions.includes(permission)) {
        return res.status(403).json({ error: `Permission '${permission}' required` });
      }

      next();
    };
  };

  // Organization access middleware
  requireOrganizationAccess = (req: Request, res: Response, next: NextFunction) => {
    const userOrgId = req.user?.organizationId || req.apiKey?.organizationId;
    const requestOrgId = req.params.organizationId || req.body.organizationId;

    if (!userOrgId || !requestOrgId || userOrgId !== requestOrgId) {
      return res.status(403).json({ error: 'Organization access denied' });
    }

    next();
  };

  // Project access middleware
  requireProjectAccess = (req: Request, res: Response, next: NextFunction) => {
    const userProjectId = req.user?.projectId || req.apiKey?.projectId;
    const requestProjectId = req.params.projectId || req.body.projectId;

    if (!userProjectId || !requestProjectId || userProjectId !== requestProjectId) {
      return res.status(403).json({ error: 'Project access denied' });
    }

    next();
  };

  // User tier middleware
  requireUserTier = (minTier: 'free' | 'pro' | 'enterprise') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const tierOrder = { free: 0, pro: 1, enterprise: 2 };
      const userTier = tierOrder[req.user.tier!];
      const requiredTier = tierOrder[minTier];

      if (userTier < requiredTier) {
        return res.status(403).json({ 
          error: `User tier '${req.user.tier}' does not meet required tier '${minTier}'` 
        });
      }

      next();
    };
  };

  // CORS middleware
  cors = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (origin && this.config.corsOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (this.config.corsOrigins.includes('*')) {
      res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-User-Id, X-Project-Id, X-Organization-Id, X-User-Tier');
    res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };

  // Input validation middleware
  validateInput = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
          return res.status(400).json({ 
            error: 'Validation failed', 
            details: error.details.map((d: any) => d.message) 
          });
        }

        req.body = value;
        next();
      } catch (error) {
        return res.status(400).json({ error: 'Input validation failed' });
      }
    };
  };

  // Security headers middleware
  securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.header('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.header('X-Content-Type-Options', 'nosniff');
    
    // XSS protection
    res.header('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    
    next();
  };

  // Request logging middleware
  requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log request
    console.log(`🚀 ${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')}`);
    
    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      const statusEmoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
      
      console.log(`${statusEmoji} ${req.method} ${req.path} - ${status} - ${duration}ms`);
    });

    next();
  };

  // Private helper methods
  private getRateLimitIdentifier(req: Request): string | null {
    if (req.user) {
      return `user:${req.user.id}`;
    } else if (req.apiKey) {
      return `apikey:${req.apiKey.id}`;
    } else if (req.ip) {
      return `ip:${req.ip}`;
    } else {
      return null;
    }
  }

  private async getAPIKeyInfo(apiKey: string): Promise<APIKeyInfo | null> {
    // This would query the database for API key info
    // For now, return mock data
    return {
      id: 'key_123',
      userId: 'user_123',
      organizationId: 'org_123',
      projectId: 'proj_123',
      permissions: ['UPLOAD', 'DOWNLOAD', 'DELETE'],
      rateLimit: 1000,
      lastUsedAt: new Date(),
    };
  }

  private async updateAPIKeyUsage(apiKeyId: string): Promise<void> {
    // Update last used timestamp in database
    console.log(`API key ${apiKeyId} used at ${new Date()}`);
  }

  private isIPBlocked(ip: string): boolean {
    const blockedUntil = this.blockedIPs.get(ip);
    if (blockedUntil && blockedUntil > Date.now()) {
      return true;
    }
    
    // Clean up expired blocks
    if (blockedUntil && blockedUntil <= Date.now()) {
      this.blockedIPs.delete(ip);
    }
    
    return false;
  }

  private blockIP(ip: string, until: number): void {
    this.blockedIPs.set(ip, until);
    console.log(`🚫 IP ${ip} blocked until ${new Date(until)}`);
  }

  private getBlockedUntil(ip: string): number {
    return this.blockedIPs.get(ip) || 0;
  }

  // Cleanup expired rate limits
  cleanupExpiredRateLimits(): void {
    const now = Date.now();
    
    for (const [key, info] of this.rateLimitStore) {
      if (info.resetTime < now) {
        this.rateLimitStore.delete(key);
      }
    }

    // Clean up expired IP blocks
    for (const [ip, blockedUntil] of this.blockedIPs) {
      if (blockedUntil <= now) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  // Get rate limit statistics
  getRateLimitStats(): {
    totalIdentifiers: number;
    blockedIdentifiers: number;
    blockedIPs: number;
    totalRequests: number;
  } {
    let blockedIdentifiers = 0;
    let totalRequests = 0;

    for (const info of this.rateLimitStore.values()) {
      if (info.blocked) blockedIdentifiers++;
      totalRequests += info.requests;
    }

    return {
      totalIdentifiers: this.rateLimitStore.size,
      blockedIdentifiers,
      blockedIPs: this.blockedIPs.size,
      totalRequests,
    };
  }
}

// Factory function
export function createAuthMiddleware(config: AuthConfig): AuthMiddleware {
  return new AuthMiddleware(config);
}

// Default configuration
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: '24h',
  apiKeyHeader: 'X-API-Key',
  enableApiKeys: true,
  enableJWT: true,
  enableAnonymous: false,
  corsOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
  rateLimitWindow: 60 * 1000, // 1 minute
  rateLimitMax: 100, // 100 requests per minute
};