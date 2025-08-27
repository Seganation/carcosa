// API Integration System - Complete Production API
// ENTERPRISE GRADE - UPLOADTHING KILLER! 🚀

// Authentication & Authorization
export { 
  AuthMiddleware, 
  createAuthMiddleware, 
  DEFAULT_AUTH_CONFIG,
  AuthConfig,
  JWTPayload,
  APIKeyInfo,
  RateLimitInfo,
} from './auth-middleware';

// Webhook System
export { 
  WebhookSystem, 
  createWebhookSystem, 
  DEFAULT_WEBHOOK_CONFIG,
  WebhookConfig,
  WebhookEventType,
  WebhookEvent,
  WebhookEndpoint,
  WebhookDelivery,
} from './webhook-system';

// Real-time System
export { 
  RealtimeSystem, 
  createRealtimeSystem, 
  DEFAULT_REALTIME_CONFIG,
  RealtimeConfig,
  RealtimeEventType,
  RealtimeEvent,
  ClientConnection,
  RoomConfig,
} from './realtime-system';

// Re-export commonly used items
export { createAuthMiddleware as default } from './auth-middleware';