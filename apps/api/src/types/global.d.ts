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
      userId: string; // Required when authenticated
      organizationId?: string;
      projectId?: string;
      teamId?: string;
    }
  }
}

// Re-export for convenience
export type AuthRequest = Request;
