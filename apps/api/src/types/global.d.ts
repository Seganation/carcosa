import { Request } from 'express';

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        name?: string;
      };
      userId?: string; // Set by auth middleware
      organizationId?: string;
      projectId?: string;
      teamId?: string;
      apiKey?: {
        id: string;
        projectId: string;
        label?: string;
        permissions: string[];
      };
    }
  }
}

// Re-export for convenience
export type AuthRequest = Request;
export type AuthenticatedRequest = Request;
