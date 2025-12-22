import { FastifyPluginAsync } from 'fastify';
import { getWebSocketService } from '../services/websocket.service';
import { v4 as uuidv4 } from 'uuid';

const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  const wsService = getWebSocketService(fastify);

  // WebSocket endpoint for real-time updates
  fastify.get('/orders', { websocket: true }, (socket, request) => {
    const clientId = uuidv4();

    // Extract user info from query params (token should be validated)
    const { userId, role, zones } = request.query as {
      userId?: string;
      role?: string;
      zones?: string
    };

    if (!userId || !role) {
      socket.send(JSON.stringify({
        event: 'error',
        message: 'Authentication required. Provide userId and role in query params.'
      }));
      socket.close();
      return;
    }

    const userZones = zones ? zones.split(',') : [];

    // Register client
    wsService.registerClient(clientId, socket, userId, role, userZones);

    // Send welcome message
    socket.send(JSON.stringify({
      event: 'connected',
      clientId,
      message: 'Connected to order updates',
      timestamp: new Date().toISOString(),
    }));

    // Handle incoming messages
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'ping':
            socket.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
            break;
          case 'subscribe':
            // Handle subscription to specific order or zone
            socket.send(JSON.stringify({
              event: 'subscribed',
              to: data.target,
              timestamp: new Date().toISOString()
            }));
            break;
          default:
            socket.send(JSON.stringify({
              event: 'unknown',
              message: `Unknown message type: ${data.type}`
            }));
        }
      } catch (error) {
        socket.send(JSON.stringify({
          event: 'error',
          message: 'Invalid message format. Expected JSON.'
        }));
      }
    });

    // Handle client disconnect
    socket.on('close', () => {
      wsService.unregisterClient(clientId);
    });

    // Handle errors
    socket.on('error', (error) => {
      fastify.log.error(`WebSocket error for client ${clientId}:`, error);
      wsService.unregisterClient(clientId);
    });
  });

  // REST endpoint to get WebSocket stats (admin only)
  fastify.get('/stats', {
    schema: {
      tags: ['websocket'],
      summary: 'Get WebSocket connection statistics',
      description: 'Returns the number of connected clients and their info',
      response: {
        200: {
          type: 'object',
          properties: {
            connectedClients: { type: 'number' },
            clients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  clientId: { type: 'string' },
                  userId: { type: 'string' },
                  role: { type: 'string' },
                  zones: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    return {
      connectedClients: wsService.getClientCount(),
      clients: wsService.getClientsInfo(),
    };
  });
};

export default websocketRoutes;
