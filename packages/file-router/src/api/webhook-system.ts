// Webhook System - Real-time Notifications
// ENTERPRISE GRADE EVENT SYSTEM! 🔔🚀

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Webhook event types
export type WebhookEventType = 
  | 'file.uploaded'
  | 'file.deleted'
  | 'file.updated'
  | 'file.downloaded'
  | 'file.transformed'
  | 'upload.session.started'
  | 'upload.session.completed'
  | 'upload.session.failed'
  | 'user.quota.exceeded'
  | 'organization.storage.warning'
  | 'api.key.created'
  | 'api.key.revoked'
  | 'user.tier.upgraded'
  | 'billing.payment.failed'
  | 'security.breach.detected';

// Webhook event data
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: Date;
  data: any;
  metadata?: {
    userId?: string;
    organizationId?: string;
    projectId?: string;
    source: string;
    version: string;
  };
}

// Webhook endpoint configuration
export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  status: 'active' | 'inactive' | 'error';
  retryCount: number;
  maxRetries: number;
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
  lastDeliveryAt?: Date;
  lastErrorAt?: Date;
  lastErrorMessage?: string;
}

// Webhook delivery attempt
export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  responseStatus?: number;
  responseBody?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook configuration
export interface WebhookConfig {
  enableWebhooks: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  timeout: number; // milliseconds
  batchSize: number;
  maxConcurrentDeliveries: number;
  enableSignatureVerification: boolean;
  signatureHeader: string;
  signatureAlgorithm: 'sha256' | 'sha512';
}

export class WebhookSystem {
  private config: WebhookConfig;
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private isProcessing: boolean = false;
  private activeDeliveries: Set<string> = new Set();

  constructor(config: Partial<WebhookConfig> = {}) {
    this.config = {
      enableWebhooks: true,
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      timeout: 30000, // 30 seconds
      batchSize: 10,
      maxConcurrentDeliveries: 5,
      enableSignatureVerification: true,
      signatureHeader: 'X-Webhook-Signature',
      signatureAlgorithm: 'sha256',
      ...config,
    };
  }

  // Register webhook endpoint
  registerEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.endpoints.set(id, newEndpoint);
    console.log(`🔔 Webhook endpoint registered: ${endpoint.name} -> ${endpoint.url}`);

    return id;
  }

  // Unregister webhook endpoint
  unregisterEndpoint(endpointId: string): boolean {
    const removed = this.endpoints.delete(endpointId);
    if (removed) {
      console.log(`🗑️ Webhook endpoint unregistered: ${endpointId}`);
    }
    return removed;
  }

  // Update webhook endpoint
  updateEndpoint(endpointId: string, updates: Partial<WebhookEndpoint>): boolean {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    const updatedEndpoint: WebhookEndpoint = {
      ...endpoint,
      ...updates,
      updatedAt: new Date(),
    };

    this.endpoints.set(endpointId, updatedEndpoint);
    console.log(`✏️ Webhook endpoint updated: ${endpointId}`);

    return true;
  }

  // Get webhook endpoint
  getEndpoint(endpointId: string): WebhookEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  // Get all endpoints
  getAllEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  // Emit webhook event
  async emitEvent(type: WebhookEventType, data: any, metadata?: WebhookEvent['metadata']): Promise<void> {
    if (!this.config.enableWebhooks) return;

    const event: WebhookEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      data,
      metadata: {
        source: 'carcosa-file-router',
        version: '1.0.0',
        ...metadata,
      },
    };

    // Add to event queue
    this.eventQueue.push(event);

    // Process events if not already processing
    if (!this.isProcessing) {
      this.processEventQueue();
    }

    console.log(`🔔 Webhook event emitted: ${type} -> ${event.id}`);
  }

  // Process event queue
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const batch = this.eventQueue.splice(0, this.config.batchSize);
        
        // Process batch
        await Promise.all(
          batch.map(event => this.processEvent(event))
        );

        // Small delay between batches
        if (this.eventQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('❌ Error processing webhook event queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual event
  private async processEvent(event: WebhookEvent): Promise<void> {
    // Find endpoints that should receive this event
    const relevantEndpoints = Array.from(this.endpoints.values()).filter(
      endpoint => endpoint.status === 'active' && endpoint.events.includes(event.type)
    );

    // Create deliveries for each endpoint
    for (const endpoint of relevantEndpoints) {
      const delivery: WebhookDelivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endpointId: endpoint.id,
        eventId: event.id,
        status: 'pending',
        attempts: 0,
        maxAttempts: this.config.maxRetries,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.deliveries.set(delivery.id, delivery);
      
      // Attempt delivery
      this.attemptDelivery(delivery, endpoint, event);
    }
  }

  // Attempt webhook delivery
  private async attemptDelivery(delivery: WebhookDelivery, endpoint: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    if (this.activeDeliveries.size >= this.config.maxConcurrentDeliveries) {
      // Queue for later delivery
      setTimeout(() => this.attemptDelivery(delivery, endpoint, event), 1000);
      return;
    }

    this.activeDeliveries.add(delivery.id);

    try {
      delivery.attempts++;
      delivery.status = 'retrying';
      delivery.updatedAt = new Date();

      // Prepare payload
      const payload = {
        event: {
          id: event.id,
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          data: event.data,
          metadata: event.metadata,
        },
        delivery: {
          id: delivery.id,
          attempt: delivery.attempts,
          maxAttempts: delivery.maxAttempts,
        },
      };

      // Generate signature
      const signature = this.generateSignature(payload, endpoint.secret);

      // Send webhook
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [this.config.signatureHeader]: signature,
          'User-Agent': 'Carcosa-Webhook/1.0',
          'X-Webhook-Event': event.type,
          'X-Webhook-Delivery': delivery.id,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (response.ok) {
        // Success
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        delivery.responseStatus = response.status;
        delivery.updatedAt = new Date();

        // Update endpoint
        endpoint.lastDeliveryAt = new Date();
        endpoint.status = 'active';
        endpoint.updatedAt = new Date();

        console.log(`✅ Webhook delivered: ${endpoint.name} -> ${event.type}`);

      } else {
        // Failed
        const responseBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${responseBody}`);
      }

    } catch (error) {
      console.error(`❌ Webhook delivery failed: ${endpoint.name} -> ${event.type}:`, error);

      // Update delivery
      delivery.status = 'failed';
      delivery.errorMessage = (error as Error).message;
      delivery.updatedAt = new Date();

      // Update endpoint
      endpoint.lastErrorAt = new Date();
      endpoint.lastErrorMessage = (error as Error).message;
      endpoint.status = 'error';
      endpoint.updatedAt = new Date();

      // Retry if attempts remaining
      if (delivery.attempts < delivery.maxAttempts) {
        delivery.status = 'retrying';
        delivery.nextRetryAt = new Date(Date.now() + this.config.retryDelay * delivery.attempts);
        
        // Schedule retry
        setTimeout(() => this.attemptDelivery(delivery, endpoint, event), this.config.retryDelay * delivery.attempts);
      }
    } finally {
      this.activeDeliveries.delete(delivery.id);
    }
  }

  // Generate webhook signature
  private generateSignature(payload: any, secret: string): string {
    const data = JSON.stringify(payload);
    
    if (this.config.signatureAlgorithm === 'sha256') {
      return `sha256=${crypto.createHmac('sha256', secret).update(data).digest('hex')}`;
    } else {
      return `sha512=${crypto.createHmac('sha512', secret).update(data).digest('hex')}`;
    }
  }

  // Verify webhook signature
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(JSON.parse(payload), secret);
    return signature === expectedSignature;
  }

  // Get webhook delivery status
  getDeliveryStatus(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  // Get all deliveries
  getAllDeliveries(): WebhookDelivery[] {
    return Array.from(this.deliveries.values());
  }

  // Get delivery statistics
  getDeliveryStats(): {
    totalDeliveries: number;
    pending: number;
    delivered: number;
    failed: number;
    retrying: number;
    successRate: number;
    averageDeliveryTime: number;
  } {
    const deliveries = Array.from(this.deliveries.values());
    
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const retrying = deliveries.filter(d => d.status === 'retrying').length;

    const successRate = total > 0 ? (delivered / total) * 100 : 0;

    // Calculate average delivery time
    const deliveredDeliveries = deliveries.filter(d => d.deliveredAt);
    let averageDeliveryTime = 0;
    
    if (deliveredDeliveries.length > 0) {
      const totalTime = deliveredDeliveries.reduce((sum, d) => {
        return sum + (d.deliveredAt!.getTime() - d.createdAt.getTime());
      }, 0);
      averageDeliveryTime = totalTime / deliveredDeliveries.length;
    }

    return {
      totalDeliveries: total,
      pending,
      delivered,
      failed,
      retrying,
      successRate,
      averageDeliveryTime,
    };
  }

  // Cleanup old deliveries
  cleanupOldDeliveries(olderThanDays: number = 30): void {
    const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    
    for (const [id, delivery] of this.deliveries) {
      if (delivery.createdAt < cutoffDate) {
        this.deliveries.delete(id);
      }
    }

    console.log(`🧹 Cleaned up webhook deliveries older than ${olderThanDays} days`);
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: {
      endpoints: number;
      activeEndpoints: number;
      errorEndpoints: number;
      pendingDeliveries: number;
      activeDeliveries: number;
      eventQueueLength: number;
    };
  } {
    const endpoints = Array.from(this.endpoints.values());
    const activeEndpoints = endpoints.filter(e => e.status === 'active').length;
    const errorEndpoints = endpoints.filter(e => e.status === 'error').length;
    const pendingDeliveries = Array.from(this.deliveries.values()).filter(d => d.status === 'pending').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Webhook system is healthy';

    if (errorEndpoints > 0) {
      status = 'degraded';
      message = `${errorEndpoints} webhook endpoints have errors`;
    }

    if (this.eventQueue.length > 100) {
      status = 'degraded';
      message = 'Webhook event queue is backing up';
    }

    if (errorEndpoints > endpoints.length * 0.5) {
      status = 'unhealthy';
      message = 'Majority of webhook endpoints have errors';
    }

    return {
      status,
      message,
      details: {
        endpoints: endpoints.length,
        activeEndpoints,
        errorEndpoints,
        pendingDeliveries,
        activeDeliveries: this.activeDeliveries.size,
        eventQueueLength: this.eventQueue.length,
      },
    };
  }
}

// Factory function
export function createWebhookSystem(config?: Partial<WebhookConfig>): WebhookSystem {
  return new WebhookSystem(config);
}

// Default configuration
export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  enableWebhooks: true,
  maxRetries: 3,
  retryDelay: 5000,
  timeout: 30000,
  batchSize: 10,
  maxConcurrentDeliveries: 5,
  enableSignatureVerification: true,
  signatureHeader: 'X-Webhook-Signature',
  signatureAlgorithm: 'sha256',
};