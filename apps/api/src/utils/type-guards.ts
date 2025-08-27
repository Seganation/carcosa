/**
 * Type guard utilities for API request validation
 */

export function assertString(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}

export function requireParam(params: any, paramName: string): string {
  const value = params[paramName];
  if (!value || typeof value !== 'string') {
    throw new Error(`Parameter '${paramName}' is required`);
  }
  return value;
}

export function requireUserId(req: any): string {
  if (!req.userId && !req.user?.id) {
    throw new Error('User authentication required');
  }
  return req.userId || req.user.id;
}
