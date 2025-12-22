import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';

interface WebSocketClient {
  socket: WebSocket;
  userId: string;
  role: string;
  zones: string[];
}

interface OrderUpdatePayload {
  type: 'ORDER_UPDATE' | 'NEW_ORDER' | 'ORDER_CANCELLED';
  orderId: string;
  orderNumber: string;
  status?: string;
  zone?: string;
  userId?: string;
  data?: any;
}

export class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();

  constructor(private fastify: FastifyInstance) {}

  /**
   * Register a new WebSocket client
   */
  registerClient(clientId: string, socket: WebSocket, userId: string, role: string, zones: string[]): void {
    this.clients.set(clientId, { socket, userId, role, zones });
    this.fastify.log.info(`WebSocket client registered: ${clientId} (user: ${userId}, role: ${role})`);
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
    this.fastify.log.info(`WebSocket client unregistered: ${clientId}`);
  }

  /**
   * Send message to a specific client
   */
  sendToClient(clientId: string, payload: any): boolean {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === 1) {
      client.socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  /**
   * Send message to a specific user (all their connections)
   */
  sendToUser(userId: string, payload: any): number {
    let sent = 0;
    this.clients.forEach((client) => {
      if (client.userId === userId && client.socket.readyState === 1) {
        client.socket.send(JSON.stringify(payload));
        sent++;
      }
    });
    return sent;
  }

  /**
   * Send order update to relevant clients
   */
  broadcastOrderUpdate(payload: OrderUpdatePayload): void {
    const message = JSON.stringify({
      event: 'order_update',
      ...payload,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.socket.readyState !== 1) return;

      // Send to admins with access to the order's zone
      if (client.role === 'SUPER_ADMIN') {
        client.socket.send(message);
      } else if (client.role === 'LOCATION_ADMIN' && payload.zone) {
        if (client.zones.includes(payload.zone)) {
          client.socket.send(message);
        }
      } else if (payload.userId && client.userId === payload.userId) {
        // Send to the order owner (shop owner)
        client.socket.send(message);
      }
    });

    this.fastify.log.info(`Broadcasted order update: ${payload.type} for order ${payload.orderNumber}`);
  }

  /**
   * Send to all admins
   */
  broadcastToAdmins(payload: any): void {
    const message = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.socket.readyState === 1 &&
          (client.role === 'SUPER_ADMIN' || client.role === 'LOCATION_ADMIN')) {
        client.socket.send(message);
      }
    });
  }

  /**
   * Send to all clients in a specific zone
   */
  broadcastToZone(zone: string, payload: any): void {
    const message = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.socket.readyState === 1 && client.zones.includes(zone)) {
        client.socket.send(message);
      }
    });
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get connected clients info (for admin)
   */
  getClientsInfo(): Array<{ clientId: string; userId: string; role: string; zones: string[] }> {
    const info: Array<{ clientId: string; userId: string; role: string; zones: string[] }> = [];
    this.clients.forEach((client, clientId) => {
      info.push({
        clientId,
        userId: client.userId,
        role: client.role,
        zones: client.zones,
      });
    });
    return info;
  }

  /**
   * Ping all clients to check connection health
   */
  pingClients(): void {
    const deadClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState !== 1) {
        deadClients.push(clientId);
      } else {
        client.socket.ping();
      }
    });

    // Remove dead clients
    deadClients.forEach((clientId) => this.unregisterClient(clientId));
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function getWebSocketService(fastify: FastifyInstance): WebSocketService {
  if (!wsService) {
    wsService = new WebSocketService(fastify);
  }
  return wsService;
}
