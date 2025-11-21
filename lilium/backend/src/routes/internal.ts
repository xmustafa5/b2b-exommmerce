import { FastifyPluginAsync } from 'fastify';
import { InternalUserService } from '../services/internal-user.service';
import { authenticateInternal } from '../middleware/internal-auth';
import { Zone, UserRole } from '@prisma/client';

const internalRoutes: FastifyPluginAsync = async (fastify) => {
  const internalService = new InternalUserService(fastify);

  // Internal team login - No authentication required for this endpoint
  fastify.post('/login', async (request: any, reply) => {
    try {
      const result = await internalService.internalLogin(request.body);
      return reply.send({
        success: true,
        ...result,
        message: 'Welcome to Lilium Internal System'
      });
    } catch (error) {
      return reply.code(401).send(error);
    }
  });

  // Create vendor account - Protected endpoint
  fastify.post('/users/vendor', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      // Generate password if not provided
      const password = request.body.password || internalService.generatePassword();

      const result = await internalService.createVendor({
        ...request.body,
        password
      });

      return reply.code(201).send({
        success: true,
        user: result.user,
        credentials: result.credentials,
        message: 'Vendor account created successfully. Please share these credentials with the vendor.'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Create company manager account - Protected endpoint
  fastify.post('/users/company-manager', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      // Generate password if not provided
      const password = request.body.password || internalService.generatePassword();

      const result = await internalService.createCompanyManager({
        ...request.body,
        password
      });

      return reply.code(201).send({
        success: true,
        user: result.user,
        credentials: result.credentials,
        message: 'Company Manager account created successfully. Please share these credentials with the manager.'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Create shop owner account - Protected endpoint
  fastify.post('/users/shop-owner', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      // Generate password if not provided
      const password = request.body.password || internalService.generatePassword();

      const result = await internalService.createShopOwner({
        ...request.body,
        password
      });

      return reply.code(201).send({
        success: true,
        user: result.user,
        credentials: result.credentials,
        message: 'Shop Owner account created successfully. Please share these credentials with the shop owner.'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // List all companies - Protected endpoint
  fastify.get('/companies', {
    preHandler: [authenticateInternal]
  }, async (request, reply) => {
    try {
      const companies = await internalService.listCompanies();
      return reply.send({
        success: true,
        companies,
        total: companies.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Create a company - Protected endpoint
  fastify.post('/companies', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      const company = await internalService.createCompany(request.body);
      return reply.code(201).send({
        success: true,
        company,
        message: 'Company created successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // List users - Protected endpoint
  fastify.get('/users', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      const role = request.query.role as UserRole | undefined;
      const users = await internalService.listUsers(role);

      return reply.send({
        success: true,
        users,
        total: users.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Deactivate user - Protected endpoint
  fastify.patch('/users/:id/deactivate', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      await internalService.deactivateUser(request.params.id);
      return reply.send({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Activate user - Protected endpoint
  fastify.patch('/users/:id/activate', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    try {
      await internalService.activateUser(request.params.id);
      return reply.send({
        success: true,
        message: 'User activated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Generate password endpoint - Protected endpoint
  fastify.get('/generate-password', {
    preHandler: [authenticateInternal]
  }, async (request: any, reply) => {
    const length = parseInt(request.query.length) || 12;
    const password = internalService.generatePassword(length);

    return reply.send({
      success: true,
      password,
      message: 'Password generated successfully'
    });
  });

  // Get available zones - Protected endpoint
  fastify.get('/zones', {
    preHandler: [authenticateInternal]
  }, async (request, reply) => {
    return reply.send({
      success: true,
      zones: Object.values(Zone),
      message: 'Available zones'
    });
  });

  // Get available roles - Protected endpoint
  fastify.get('/roles', {
    preHandler: [authenticateInternal]
  }, async (request, reply) => {
    return reply.send({
      success: true,
      roles: {
        dashboard: [UserRole.VENDOR, UserRole.COMPANY_MANAGER],
        mobile: [UserRole.SHOP_OWNER]
      },
      message: 'Available roles for user creation'
    });
  });
};

export default internalRoutes;