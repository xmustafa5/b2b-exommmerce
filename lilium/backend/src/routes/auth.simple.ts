import { FastifyPluginAsync } from 'fastify';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  // Dashboard Login - For VENDOR, COMPANY_MANAGER, ADMIN, SUPER_ADMIN
  // Note: User accounts are created by super-admin or admin through the dashboard
  fastify.post('/login/dashboard', {
    schema: {
      tags: ['auth'],
      summary: 'Dashboard login for vendors and admins',
      description: 'Login endpoint for VENDOR, COMPANY_MANAGER, ADMIN, and SUPER_ADMIN roles',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          description: 'Successful login',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                companyId: { type: 'string', nullable: true }
              }
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        },
        401: {
          description: 'Invalid credentials or unauthorized role',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const result = await authService.loginDashboard(request.body);
      return reply.send(result);
    } catch (error) {
      return reply.code(401).send(error);
    }
  });

  // Mobile Login - For SHOP_OWNER only
  // Note: Shop owner accounts are created directly in database or by admin
  fastify.post('/login/mobile', {
    schema: {
      tags: ['auth'],
      summary: 'Mobile login for shop owners',
      description: 'Login endpoint for SHOP_OWNER role only',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          description: 'Successful login',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                businessName: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                role: { type: 'string' },
                zones: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        },
        401: {
          description: 'Invalid credentials or unauthorized role',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const result = await authService.loginMobile(request.body);
      return reply.send(result);
    } catch (error) {
      return reply.code(401).send(error);
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Get current user profile',
      description: 'Returns the profile of the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User profile',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            businessName: { type: 'string', nullable: true },
            role: { type: 'string' },
            zones: {
              type: 'array',
              items: { type: 'string' },
              nullable: true
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Logout user',
      description: 'Invalidates the current user session',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successfully logged out',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      await authService.logout(request.user.userId);
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Refresh access token',
      description: 'Generate new access token using refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'New tokens',
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        },
        401: {
          description: 'Invalid refresh token',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const tokens = await authService.refreshToken(request.body.refreshToken);
      return reply.send(tokens);
    } catch (error) {
      return reply.code(401).send(error);
    }
  });

  // Request password reset
  fastify.post('/password/request-reset', {
    schema: {
      tags: ['auth'],
      summary: 'Request password reset',
      description: 'Send password reset email to user',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          description: 'Request processed',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      await authService.requestPasswordReset(request.body);
      return reply.send({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Reset password with token
  fastify.post('/password/reset', {
    schema: {
      tags: ['auth'],
      summary: 'Reset password',
      description: 'Reset password using token from email',
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          description: 'Password reset successful',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Invalid or expired token',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      await authService.resetPassword(request.body);
      return reply.send({ message: 'Password has been reset successfully' });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update password (authenticated)
  fastify.put('/password', {
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Update password',
      description: 'Change password for authenticated user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 6 },
          newPassword: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          description: 'Password updated successfully',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Invalid current password',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
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