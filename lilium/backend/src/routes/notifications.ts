import { FastifyPluginAsync } from 'fastify';
import { authenticate, requireAdmin, requireRole } from '../middleware/auth';
import { handleError } from '../utils/errors';
import { NotificationService } from '../services/notification.service';
import { UserRole, Zone } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const registerTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
});

const sendNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

const sendToUserSchema = sendNotificationSchema.extend({
  userId: z.string(),
});

const sendToZoneSchema = sendNotificationSchema.extend({
  zone: z.nativeEnum(Zone),
});

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const notificationService = new NotificationService(fastify);

  // POST /api/notifications/register-token - Register FCM token for current user
  fastify.post('/register-token', {
    preHandler: [authenticate],
    schema: {
      description: 'Register or update FCM token for push notifications',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fcmToken'],
        properties: {
          fcmToken: { type: 'string', description: 'Firebase Cloud Messaging token' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { fcmToken } = registerTokenSchema.parse(request.body);
      await notificationService.registerToken(request.user.userId, fcmToken);
      return reply.send({ message: 'FCM token registered successfully' });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // DELETE /api/notifications/unregister-token - Remove FCM token (on logout)
  fastify.delete('/unregister-token', {
    preHandler: [authenticate],
    schema: {
      description: 'Unregister FCM token (call on logout)',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      await notificationService.removeToken(request.user.userId);
      return reply.send({ message: 'FCM token removed successfully' });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/notifications/status - Check if push notifications are enabled
  fastify.get('/status', {
    preHandler: [authenticate],
    schema: {
      description: 'Check push notification status for current user',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            firebaseInitialized: { type: 'boolean' },
            tokenRegistered: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { fcmToken: true },
      });

      return reply.send({
        firebaseInitialized: notificationService.isInitialized(),
        tokenRegistered: !!user?.fcmToken,
      });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // POST /api/notifications/send-to-user - Send notification to specific user (Admin only)
  fastify.post('/send-to-user', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      description: 'Send push notification to a specific user',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['userId', 'title', 'body'],
        properties: {
          userId: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          data: { type: 'object' },
          imageUrl: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = sendToUserSchema.parse(request.body);

      const user = await fastify.prisma.user.findUnique({
        where: { id: data.userId },
        select: { fcmToken: true, name: true },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      if (!user.fcmToken) {
        return reply.send({
          success: false,
          message: 'User has no FCM token registered',
        });
      }

      const success = await notificationService.sendToDevice(user.fcmToken, {
        title: data.title,
        body: data.body,
        data: data.data,
        imageUrl: data.imageUrl,
      });

      return reply.send({
        success,
        message: success ? 'Notification sent successfully' : 'Failed to send notification',
      });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // POST /api/notifications/send-to-admins - Send notification to all admins
  fastify.post('/send-to-admins', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      description: 'Send push notification to all admins',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'body'],
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          data: { type: 'object' },
          imageUrl: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = sendNotificationSchema.parse(request.body);
      await notificationService.sendToAdmins(data);
      return reply.send({ message: 'Notification sent to all admins' });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // POST /api/notifications/send-to-zone - Send notification to all users in a zone
  fastify.post('/send-to-zone', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Send push notification to all users in a specific zone',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['zone', 'title', 'body'],
        properties: {
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
          title: { type: 'string' },
          body: { type: 'string' },
          data: { type: 'object' },
          imageUrl: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = sendToZoneSchema.parse(request.body);

      // Zone access check for LOCATION_ADMIN
      if (request.user.role === 'LOCATION_ADMIN' && request.user.zones?.length > 0) {
        if (!request.user.zones.includes(data.zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
      }

      await notificationService.sendToZone(data.zone, {
        title: data.title,
        body: data.body,
        data: data.data,
        imageUrl: data.imageUrl,
      });

      return reply.send({ message: `Notification sent to all users in ${data.zone} zone` });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // POST /api/notifications/test - Test notification to current user
  fastify.post('/test', {
    preHandler: [authenticate],
    schema: {
      description: 'Send a test notification to yourself',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { fcmToken: true, name: true },
      });

      if (!user?.fcmToken) {
        return reply.send({
          success: false,
          message: 'No FCM token registered. Please register a token first.',
        });
      }

      const success = await notificationService.sendToDevice(user.fcmToken, {
        title: '🔔 Test Notification',
        body: `Hello ${user.name}! This is a test notification from Lilium B2B.`,
        data: {
          type: 'TEST',
          timestamp: new Date().toISOString(),
        },
      });

      return reply.send({
        success,
        message: success
          ? 'Test notification sent successfully!'
          : 'Failed to send test notification',
      });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });
};

export default notificationRoutes;
