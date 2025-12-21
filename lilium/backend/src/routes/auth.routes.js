"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../types/auth");
const authRoutes = async (fastify) => {
    const authService = new auth_service_1.AuthService(fastify);
    /**
     * @route POST /auth/register
     * @description Register a new user
     * @access Public
     */
    fastify.post('/register', {
        schema: {
            tags: ['auth'],
            summary: 'Register a new user',
            response: {
                201: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string' },
                                role: { type: 'string' },
                            },
                        },
                        tokens: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const parsed = auth_2.registerSchema.parse(request.body);
            const result = await authService.register(parsed);
            return reply.code(201).send(result);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(400).send({ error: error.message || 'Registration failed' });
        }
    });
    /**
     * @route POST /auth/register/mobile
     * @description Register a new shop owner from mobile app
     * @access Public
     */
    fastify.post('/register/mobile', {
        schema: {
            body: auth_2.mobileRegisterSchema,
            tags: ['auth'],
            summary: 'Register a new shop owner (mobile)',
            response: {
                201: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string' },
                                businessName: { type: 'string' },
                                phone: { type: 'string' },
                                role: { type: 'string' },
                            },
                        },
                        tokens: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const result = await authService.registerMobile(request.body);
        return reply.code(201).send(result);
    });
    /**
     * @route POST /auth/login
     * @description Login with email and password
     * @access Public
     */
    fastify.post('/login', {
        schema: {
            body: auth_2.loginSchema,
            tags: ['auth'],
            summary: 'Login with email and password',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string' },
                                role: { type: 'string' },
                            },
                        },
                        tokens: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const result = await authService.login(request.body);
        return reply.send(result);
    });
    /**
     * @route POST /auth/otp/request
     * @description Request OTP for phone login
     * @access Public
     */
    fastify.post('/otp/request', {
        schema: {
            body: auth_2.requestOtpSchema,
            tags: ['auth'],
            summary: 'Request OTP for phone login',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        await authService.sendOtp(request.body.phone);
        return reply.send({ message: 'OTP sent successfully' });
    });
    /**
     * @route POST /auth/otp/login
     * @description Login with phone and OTP
     * @access Public
     */
    fastify.post('/otp/login', {
        schema: {
            body: auth_2.otpLoginSchema,
            tags: ['auth'],
            summary: 'Login with phone and OTP',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string' },
                                businessName: { type: 'string' },
                                phone: { type: 'string' },
                                role: { type: 'string' },
                            },
                        },
                        tokens: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const result = await authService.loginWithOtp(request.body);
        return reply.send(result);
    });
    /**
     * @route POST /auth/refresh
     * @description Refresh access token
     * @access Public
     */
    fastify.post('/refresh', {
        schema: {
            body: auth_2.refreshTokenSchema,
            tags: ['auth'],
            summary: 'Refresh access token',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const tokens = await authService.refreshToken(request.body.refreshToken);
        return reply.send(tokens);
    });
    /**
     * @route POST /auth/password/reset-request
     * @description Request password reset
     * @access Public
     */
    fastify.post('/password/reset-request', {
        schema: {
            body: auth_2.requestPasswordResetSchema,
            tags: ['auth'],
            summary: 'Request password reset',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        await authService.requestPasswordReset(request.body);
        return reply.send({ message: 'Password reset instructions sent to email' });
    });
    /**
     * @route POST /auth/password/reset
     * @description Reset password with token
     * @access Public
     */
    fastify.post('/password/reset', {
        schema: {
            body: auth_2.resetPasswordSchema,
            tags: ['auth'],
            summary: 'Reset password with token',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        await authService.resetPassword(request.body);
        return reply.send({ message: 'Password reset successfully' });
    });
    /**
     * @route PUT /auth/password/update
     * @description Update current password
     * @access Private
     */
    fastify.put('/password/update', {
        preHandler: [auth_1.authenticate],
        schema: {
            body: auth_2.updatePasswordSchema,
            tags: ['auth'],
            summary: 'Update current password',
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
    }, async (request, reply) => {
        await authService.updatePassword(request.user.userId, request.body);
        return reply.send({ message: 'Password updated successfully' });
    });
    /**
     * @route POST /auth/logout
     * @description Logout user
     * @access Private
     */
    fastify.post('/logout', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['auth'],
            summary: 'Logout user',
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
    }, async (request, reply) => {
        await authService.logout(request.user.userId);
        return reply.send({ message: 'Logged out successfully' });
    });
    /**
     * @route GET /auth/me
     * @description Get current user
     * @access Private
     */
    fastify.get('/me', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['auth'],
            summary: 'Get current user',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
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
                            items: { type: 'string' },
                        },
                        isActive: { type: 'boolean' },
                        emailVerified: { type: 'boolean' },
                        phoneVerified: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const user = await fastify.prisma.user.findUnique({
            where: { id: request.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                businessName: true,
                phone: true,
                role: true,
                zones: true,
                isActive: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw fastify.httpErrors.notFound('User not found');
        }
        return reply.send(user);
    });
};
exports.default = authRoutes;
//# sourceMappingURL=auth.routes.js.map