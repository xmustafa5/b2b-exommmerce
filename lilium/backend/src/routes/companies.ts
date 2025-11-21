import { FastifyPluginAsync } from 'fastify';
import { CompanyService } from '../services/company.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole, Zone } from '@prisma/client';

const companyRoutes: FastifyPluginAsync = async (fastify) => {
  const companyService = new CompanyService(fastify);

  // Create a new company (Admin only)
  fastify.post('/', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const company = await companyService.createCompany(request.body);
      return reply.code(201).send({
        success: true,
        company,
        message: 'Company created successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update company (Admin or Company Manager)
  fastify.put('/:id', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      // Check authorization
      if (user.role === UserRole.COMPANY_MANAGER && user.companyId !== id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only update your own company'
        });
      }

      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      const company = await companyService.updateCompany(id, request.body);
      return reply.send({
        success: true,
        company,
        message: 'Company updated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get company by ID (Public with limited data, Full data for authorized users)
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const company = await companyService.getCompanyById(id);

      // Remove sensitive data for public access
      if (!request.user) {
        delete (company as any).commissionRate;
        delete (company as any).stats;
      }

      return reply.send({
        success: true,
        company
      });
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // List companies with filters
  fastify.get('/', async (request: any, reply) => {
    try {
      const { zone, isActive, search, page, limit } = request.query;

      const filter = {
        zone: zone as Zone,
        isActive: isActive === 'true',
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const result = await companyService.listCompanies(filter);

      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get company statistics (Company Manager or Admin)
  fastify.get('/:id/stats', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      // Check authorization
      if (user.role === UserRole.COMPANY_MANAGER && user.companyId !== id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only view stats for your own company'
        });
      }

      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.VENDOR].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      const stats = await companyService.getCompanyStats(id);

      return reply.send({
        success: true,
        stats
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Toggle company status (Admin only)
  fastify.patch('/:id/status', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { isActive } = request.body;

      const company = await companyService.toggleCompanyStatus(id, isActive);

      return reply.send({
        success: true,
        company,
        message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update delivery fees (Company Manager or Admin)
  fastify.patch('/:id/delivery-fees', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      // Check authorization
      if (user.role === UserRole.COMPANY_MANAGER && user.companyId !== id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only update delivery fees for your own company'
        });
      }

      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      const company = await companyService.updateDeliveryFees(id, request.body.deliveryFees);

      return reply.send({
        success: true,
        company,
        message: 'Delivery fees updated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update commission rate (Admin only)
  fastify.patch('/:id/commission', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { commissionRate } = request.body;

      const company = await companyService.updateCommissionRate(id, commissionRate);

      return reply.send({
        success: true,
        company,
        message: 'Commission rate updated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get company vendors (Company Manager, Vendor, or Admin)
  fastify.get('/:id/vendors', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      // Check authorization
      if ((user.role === UserRole.COMPANY_MANAGER || user.role === UserRole.VENDOR) && user.companyId !== id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only view vendors for your own company'
        });
      }

      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER, UserRole.VENDOR].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      const vendors = await companyService.getCompanyVendors(id);

      return reply.send({
        success: true,
        vendors,
        total: vendors.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get company products
  fastify.get('/:id/products', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { page, limit } = request.query;

      const result = await companyService.getCompanyProducts(
        id,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );

      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get companies by zone
  fastify.get('/zone/:zone', async (request: any, reply) => {
    try {
      const { zone } = request.params;

      if (!Object.values(Zone).includes(zone as Zone)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid zone'
        });
      }

      const companies = await companyService.getCompaniesByZone(zone as Zone);

      return reply.send({
        success: true,
        companies,
        total: companies.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Calculate company payouts (Company Manager or Admin)
  fastify.get('/:id/payouts', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { startDate, endDate } = request.query;
      const user = request.user;

      // Check authorization
      if (user.role === UserRole.COMPANY_MANAGER && user.companyId !== id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only view payouts for your own company'
        });
      }

      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      const payouts = await companyService.calculateCompanyPayouts(
        id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      return reply.send({
        success: true,
        payouts
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });
};

export default companyRoutes;