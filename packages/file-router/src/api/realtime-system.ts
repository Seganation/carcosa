// Real-time WebSocket System
// LIVE UPDATES - ENTERPRISE GRADE! ⚡🚀

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Real-time event types
export type RealtimeEventType = 
  | 'upload.progress'
  | 'upload.completed'
  | 'upload.failed'
  | 'upload.cancelled'
  | 'file.transformed'
  | 'file.deleted'
  | 'quota.warning'
  | 'quota.exceeded'
  | 'storage.alert'
  | 'user.online'
  | 'user.offline'
  | 'project.updated'
  | 'organization.updated';

// Real-time event data
export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
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

// Client connection info
export interface ClientConnection {
  id: string;
  userId?: string;
  organizationId?: string;
  projectId?: string;
  userAgent: string;
  ipAddress: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
}

// Room configuration
export interface RoomConfig {
  name: string;
  description: string;
  events: RealtimeEventType[];
  maxClients: number;
  requireAuth: boolean;
  requirePermission?: string;
}

// Real-time configuration
export interface RealtimeConfig {
  enableRealtime: boolean;
  corsOrigins: string[];
  maxConnections: number;
  heartbeatInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
  enableCompression: boolean;
  enableBinaryMessages: boolean;
  enableStickySessions: boolean;
}

export class RealtimeSystem {
  private config: RealtimeConfig;
  private io: SocketIOServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private rooms: Map<string, RoomConfig> = new Map();
  private eventHistory: Map<string, RealtimeEvent[]> = new Map();
  private maxEventHistory: number = 100;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      enableRealtime: true,
      corsOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
      maxConnections: 1000,
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 60000, // 1 minute
      enableCompression: true,
      enableBinaryMessages: false,
      enableStickySessions: false,
      ...config,
    };

    this.initializeDefaultRooms();
  }

  // Initialize with HTTP server
  initialize(server: HTTPServer): void {
    if (!this.config.enableRealtime) return;

    this.io = new SocketIOServer(server, {
      cors: {
        origin: this.config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      maxHttpBufferSize: 1e6, // 1MB
      pingTimeout: this.config.connectionTimeout,
      pingInterval: this.config.heartbeatInterval,
      // compression: this.config.enableCompression, // Not supported in socket.io v4
      allowEIO3: true,
    });

    this.setupEventHandlers();
    console.log('⚡ Real-time WebSocket system initialized');
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Periodic cleanup
    setInterval(() => this.cleanupInactiveConnections(), this.config.heartbeatInterval);
  }

  // Handle new connection
  private handleConnection(socket: any): void {
    const clientId = socket.id;
    const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
    const ipAddress = socket.handshake.address || 'Unknown';

    // Create client connection
    const client: ClientConnection = {
      id: clientId,
      userAgent,
      ipAddress,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
    };

    this.clients.set(clientId, client);

    console.log(`🔌 Client connected: ${clientId} from ${ipAddress}`);

    // Handle authentication
    socket.on('authenticate', (data: { token: string; userId: string; organizationId?: string; projectId?: string }) => {
      this.authenticateClient(clientId, data);
    });

    // Handle room subscriptions
    socket.on('subscribe', (roomName: string) => {
      this.subscribeToRoom(clientId, roomName);
    });

    socket.on('unsubscribe', (roomName: string) => {
      this.unsubscribeFromRoom(clientId, roomName);
    });

    // Handle custom events
    socket.on('custom_event', (data: any) => {
      this.handleCustomEvent(clientId, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(clientId, reason);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      console.error(`❌ Socket error for client ${clientId}:`, error);
    });

    // Send welcome message
    socket.emit('connected', {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to Carcosa Real-time System',
      version: '1.0.0',
    });
  }

  // Authenticate client
  private authenticateClient(clientId: string, data: { token: string; userId: string; organizationId?: string; projectId?: string }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // TODO: Verify JWT token
    // For now, just accept the data
    client.userId = data.userId;
    client.organizationId = data.organizationId;
    client.projectId = data.projectId;

    // Join user-specific room
    if (data.userId) {
      this.joinRoom(clientId, `user:${data.userId}`);
    }

    // Join organization room
    if (data.organizationId) {
      this.joinRoom(clientId, `org:${data.organizationId}`);
    }

    // Join project room
    if (data.projectId) {
      this.joinRoom(clientId, `project:${data.projectId}`);
    }

    console.log(`🔐 Client authenticated: ${clientId} -> User ${data.userId}`);
  }

  // Subscribe to room
  private subscribeToRoom(clientId: string, roomName: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const room = this.rooms.get(roomName);
    if (!room) {
      console.warn(`⚠️ Room not found: ${roomName}`);
      return;
    }

    // Check authentication requirement
    if (room.requireAuth && !client.userId) {
      console.warn(`⚠️ Client ${clientId} tried to join authenticated room ${roomName} without auth`);
      return;
    }

    // Check permissions
    if (room.requirePermission && client.userId) {
      // TODO: Check user permissions
      // For now, allow all authenticated users
    }

    // Check room capacity
    const roomClients = this.getRoomClients(roomName);
    if (roomClients.length >= room.maxClients) {
      console.warn(`⚠️ Room ${roomName} is at capacity`);
      return;
    }

    this.joinRoom(clientId, roomName);
    client.subscriptions.add(roomName);

    console.log(`📡 Client ${clientId} subscribed to room: ${roomName}`);
  }

  // Unsubscribe from room
  private unsubscribeFromRoom(clientId: string, roomName: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.leaveRoom(clientId, roomName);
    client.subscriptions.delete(roomName);

    console.log(`📡 Client ${clientId} unsubscribed from room: ${roomName}`);
  }

  // Join room
  private joinRoom(clientId: string, roomName: string): void {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.join(roomName);
      socket.emit('room_joined', { room: roomName, timestamp: new Date().toISOString() });
    }
  }

  // Leave room
  private leaveRoom(clientId: string, roomName: string): void {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.leave(roomName);
      socket.emit('room_left', { room: roomName, timestamp: new Date().toISOString() });
    }
  }

  // Get clients in room
  private getRoomClients(roomName: string): ClientConnection[] {
    if (!this.io) return [];

    const room = this.io.sockets.adapter.rooms.get(roomName);
    if (!room) return [];

    return Array.from(room).map(clientId => this.clients.get(clientId)).filter(Boolean) as ClientConnection[];
  }

  // Handle custom event
  private handleCustomEvent(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    // Echo back to sender
    this.emitToClient(clientId, 'file.transform.complete' as RealtimeEventType, {
      originalData: data,
      timestamp: new Date().toISOString(),
      clientId,
    });
  }

  // Handle disconnection
  private handleDisconnection(clientId: string, reason: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave all rooms
    for (const roomName of client.subscriptions) {
      this.leaveRoom(clientId, roomName);
    }

    // Remove client
    this.clients.delete(clientId);

    console.log(`🔌 Client disconnected: ${clientId} - Reason: ${reason}`);
  }

  // Emit event to specific client
  emitToClient(clientId: string, eventType: RealtimeEventType, data: any): void {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.emit(eventType, {
        ...data,
        timestamp: new Date().toISOString(),
        eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }
  }

  // Emit event to room
  emitToRoom(roomName: string, eventType: RealtimeEventType, data: any): void {
    if (!this.io) return;

    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: new Date(),
      data,
      metadata: {
        source: 'carcosa-realtime',
        version: '1.0.0',
      },
    };

    // Store in history
    if (!this.eventHistory.has(roomName)) {
      this.eventHistory.set(roomName, []);
    }

    const roomHistory = this.eventHistory.get(roomName)!;
    roomHistory.push(event);

    // Limit history size
    if (roomHistory.length > this.maxEventHistory) {
      roomHistory.splice(0, roomHistory.length - this.maxEventHistory);
    }

    // Emit to room
    this.io.to(roomName).emit(eventType, {
      ...data,
      timestamp: event.timestamp.toISOString(),
      eventId: event.id,
    });

    console.log(`📡 Event emitted to room ${roomName}: ${eventType}`);
  }

  // Emit event to organization
  emitToOrganization(organizationId: string, eventType: RealtimeEventType, data: any): void {
    this.emitToRoom(`org:${organizationId}`, eventType, data);
  }

  // Emit event to project
  emitToProject(projectId: string, eventType: RealtimeEventType, data: any): void {
    this.emitToRoom(`project:${projectId}`, eventType, data);
  }

  // Emit event to user
  emitToUser(userId: string, eventType: RealtimeEventType, data: any): void {
    this.emitToRoom(`user:${userId}`, eventType, data);
  }

  // Broadcast to all clients
  broadcast(eventType: RealtimeEventType, data: any): void {
    if (!this.io) return;

    this.io.emit(eventType, {
      ...data,
      timestamp: new Date().toISOString(),
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    console.log(`📡 Event broadcasted to all clients: ${eventType}`);
  }

  // Add custom room
  addRoom(config: RoomConfig): void {
    this.rooms.set(config.name, config);
    console.log(`🏠 Custom room added: ${config.name} - ${config.description}`);
  }

  // Remove custom room
  removeRoom(roomName: string): void {
    this.rooms.delete(roomName);
    console.log(`🗑️ Custom room removed: ${roomName}`);
  }

  // Get room info
  getRoomInfo(roomName: string): RoomConfig | undefined {
    return this.rooms.get(roomName);
  }

  // Get all rooms
  getAllRooms(): RoomConfig[] {
    return Array.from(this.rooms.values());
  }

  // Get client info
  getClientInfo(clientId: string): ClientConnection | undefined {
    return this.clients.get(clientId);
  }

  // Get all clients
  getAllClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  // Get room clients
  getRoomClientsInfo(roomName: string): ClientConnection[] {
    return this.getRoomClients(roomName);
  }

  // Get event history for room
  getEventHistory(roomName: string, limit: number = 50): RealtimeEvent[] {
    const history = this.eventHistory.get(roomName) || [];
    return history.slice(-limit);
  }

  // Cleanup inactive connections
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const timeout = this.config.connectionTimeout;

    for (const [clientId, client] of this.clients) {
      if (now - client.lastActivity.getTime() > timeout) {
        console.log(`⏰ Cleaning up inactive client: ${clientId}`);
        
        // Force disconnect
        if (this.io) {
          const socket = this.io.sockets.sockets.get(clientId);
          if (socket) {
            socket.disconnect(true);
          }
        }

        this.clients.delete(clientId);
      }
    }
  }

  // Initialize default rooms
  private initializeDefaultRooms(): void {
    // User rooms
    this.rooms.set('user:*', {
      name: 'user:*',
      description: 'User-specific rooms for individual updates',
      events: ['upload.progress', 'upload.completed', 'upload.failed', 'quota.warning', 'quota.exceeded'],
      maxClients: 1,
      requireAuth: true,
    });

    // Organization rooms
    this.rooms.set('org:*', {
      name: 'org:*',
      description: 'Organization-wide updates and notifications',
      events: ['storage.alert', 'organization.updated', 'user.online', 'user.offline'],
      maxClients: 100,
      requireAuth: true,
    });

    // Project rooms
    this.rooms.set('project:*', {
      name: 'project:*',
      description: 'Project-specific updates and collaboration',
      events: ['upload.completed', 'file.transformed', 'file.deleted', 'project.updated'],
      maxClients: 50,
      requireAuth: true,
    });

    // Global room
    this.rooms.set('global', {
      name: 'global',
      description: 'Global system updates and announcements',
      events: ['storage.alert'],
      maxClients: 1000,
      requireAuth: false,
    });
  }

  // Get system statistics
  getStats(): {
    totalClients: number;
    totalRooms: number;
    activeConnections: number;
    totalEvents: number;
    averageEventsPerSecond: number;
    memoryUsage: number;
  } {
    const totalClients = this.clients.size;
    const totalRooms = this.rooms.size;
    const activeConnections = this.io?.engine.clientsCount || 0;
    
    let totalEvents = 0;
    for (const history of this.eventHistory.values()) {
      totalEvents += history.length;
    }

    // Calculate average events per second (simplified)
    const oldestClient = Array.from(this.clients.values()).sort((a, b) => a.connectedAt.getTime() - b.connectedAt.getTime())[0];
    const averageEventsPerSecond = totalEvents / Math.max(1, (Date.now() - (oldestClient?.connectedAt.getTime() || Date.now())) / 1000);

    // Get memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    return {
      totalClients,
      totalRooms,
      activeConnections,
      totalEvents,
      averageEventsPerSecond,
      memoryUsage,
    };
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: {
      connections: number;
      rooms: number;
      memoryUsage: number;
      eventQueue: number;
    };
  } {
    const stats = this.getStats();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Real-time system is healthy';

    if (stats.memoryUsage > 100) { // More than 100MB
      status = 'degraded';
      message = 'High memory usage detected';
    }

    if (stats.activeConnections > this.config.maxConnections * 0.8) {
      status = 'degraded';
      message = 'Approaching connection limit';
    }

    if (stats.memoryUsage > 500) { // More than 500MB
      status = 'unhealthy';
      message = 'Critical memory usage';
    }

    return {
      status,
      message,
      details: {
        connections: stats.activeConnections,
        rooms: stats.totalRooms,
        memoryUsage: stats.memoryUsage,
        eventQueue: stats.totalEvents,
      },
    };
  }

  // Graceful shutdown
  shutdown(): void {
    if (this.io) {
      this.io.close();
      console.log('🔌 Real-time system shutdown complete');
    }
  }
}

// Factory function
export function createRealtimeSystem(config?: Partial<RealtimeConfig>): RealtimeSystem {
  return new RealtimeSystem(config);
}

// Default configuration
export const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  enableRealtime: true,
  corsOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
  maxConnections: 1000,
  heartbeatInterval: 30000,
  connectionTimeout: 60000,
  enableCompression: true,
  enableBinaryMessages: false,
  enableStickySessions: false,
};