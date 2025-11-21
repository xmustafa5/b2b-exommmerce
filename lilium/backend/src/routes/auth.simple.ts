import { FastifyPluginAsync } from 'fastify';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  // Dashboard Login - For VENDOR, COMPANY_MANAGER, ADMIN, SUPER_ADMIN
  // Note: User accounts are created by super-admin or admin through the dashboard
  fastify.post('/login/dashboard', async (request: any, reply) => {
    try {
      const result = await authService.loginDashboard(request.body);
      return reply.send(result);
    } catch (error) {
      return reply.code(401).send(error);
    }
  });

  // Mobile Login - For SHOP_OWNER only
  // Note: Shop owner accounts are created directly in database or by admin
  fastify.post('/login/mobile', async (request: any, reply) => {
    try {
      const result = await authService.loginMobile(request.body);
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

  // Request password reset
  fastify.post('/password/request-reset', async (request: any, reply) => {
    try {
      await authService.requestPasswordReset(request.body);
      return reply.send({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Reset password with token
  fastify.post('/password/reset', async (request: any, reply) => {
    try {
      await authService.resetPassword(request.body);
      return reply.send({ message: 'Password has been reset successfully' });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update password (authenticated)
  fastify.put('/password', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      await authService.updatePassword(request.user.userId, request.body);
      return reply.send({ message: 'Password updated successfully' });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });
};

export default authRoutes;