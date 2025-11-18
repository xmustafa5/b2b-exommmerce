import { FastifyPluginAsync } from 'fastify';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  // Register
  fastify.post('/register', async (request: any, reply) => {
    try {
      const result = await authService.register(request.body);
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Login
  fastify.post('/login', async (request: any, reply) => {
    try {
      const result = await authService.login(request.body);
      return reply.send(result);
    } catch (error) {
      return reply.code(401).send(error);
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          role: true,
          zones: true,
        }
      });
      return reply.send(user);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Logout
  fastify.post('/logout', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      await authService.logout(request.user.userId);
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request: any, reply) => {
    try {
      const tokens = await authService.refreshToken(request.body.refreshToken);
      return reply.send(tokens);
    } catch (error) {
      return reply.code(401).send(error);
    }
  });
};

export default authRoutes;