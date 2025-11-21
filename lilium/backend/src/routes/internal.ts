import { FastifyPluginAsync } from 'fastify';
import { InternalUserService } from '../services/internal-user.service';
import { authenticateInternal } from '../middleware/internal-auth';
import { Zone, UserRole } from '@prisma/client';

const internalRoutes: FastifyPluginAsync = async (fastify) => {
  const internalService = new InternalUserService(fastify);

  // Internal team login - No authentication required for this endpoint
  fastify.post('/login', {
    schema: {
      tags: ['internal'],
      summary: 'Internal team login',
      description: 'Login for Lilium internal team (lilium@lilium.iq)',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Use: lilium@lilium.iq' },
          password: { type: 'string', description: 'Use: lilium@123' }
        }
      },
      response: {
        200: {
          description: 'Successful login',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            authenticated: { type: 'boolean' },
            token: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Invalid credentials',
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Create vendor account',
      description: 'Create a new vendor account for dashboard access',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'name', 'companyId'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          password: { type: 'string', minLength: 6, nullable: true, description: 'Auto-generated if not provided' },
          companyId: { type: 'string', format: 'uuid' },
          phone: { type: 'string', nullable: true },
          zones: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['KARKH', 'RUSAFA', 'SADR_CITY', 'KADHMIYA', 'ADHAMIYA', 'MANSOUR', 'ZAFARANIYA', 'KARRADA', 'NEW_BAGHDAD', 'AL_RASHID']
            },
            nullable: true
          }
        }
      },
      response: {
        201: {
          description: 'Vendor created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                companyId: { type: 'string' }
              }
            },
            credentials: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                password: { type: 'string' },
                loginUrl: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Create company manager account',
      description: 'Create a new company manager account for dashboard access. Company managers have permissions to manage vendors and products within their assigned company.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'name', 'companyId'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Company manager email address, e.g. manager@company.com' },
          name: { type: 'string', minLength: 2, description: 'Full name of the company manager, e.g. John Doe' },
          password: { type: 'string', minLength: 6, nullable: true, description: 'Account password. Auto-generated if not provided' },
          companyId: { type: 'string', format: 'uuid', description: 'UUID of the company this manager will be assigned to' },
          phone: { type: 'string', nullable: true, description: 'Contact phone number, e.g. +964-770-123-4567' },
          zones: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['KARKH', 'RUSAFA', 'SADR_CITY', 'KADHMIYA', 'ADHAMIYA', 'MANSOUR', 'ZAFARANIYA', 'KARRADA', 'NEW_BAGHDAD', 'AL_RASHID']
            },
            nullable: true,
            description: 'Array of zones the manager can operate in'
          }
        }
      },
      response: {
        201: {
          description: 'Company manager created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier of the created user' },
                email: { type: 'string', description: 'Email address of the company manager' },
                name: { type: 'string', description: 'Full name of the company manager' },
                role: { type: 'string', description: 'User role, will be COMPANY_MANAGER' },
                companyId: { type: 'string', description: 'UUID of the assigned company' }
              }
            },
            credentials: {
              type: 'object',
              properties: {
                email: { type: 'string', description: 'Login email for the account' },
                password: { type: 'string', description: 'Password for the account (plain text, share securely)' },
                loginUrl: { type: 'string', description: 'URL where the manager can login' }
              }
            },
            message: { type: 'string', description: 'Success message with instructions' }
          }
        },
        400: {
          description: 'Bad request - validation error or email already exists',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Detailed error message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Create shop owner account',
      description: 'Create a new shop owner account for mobile app access',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'name', 'businessName', 'phone', 'zones'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          businessName: { type: 'string', minLength: 2 },
          phone: { type: 'string', pattern: '^[0-9+\\-\\s()]+$' },
          password: { type: 'string', minLength: 6, nullable: true, description: 'Auto-generated if not provided' },
          zones: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['KARKH', 'RUSAFA', 'SADR_CITY', 'KADHMIYA', 'ADHAMIYA', 'MANSOUR', 'ZAFARANIYA', 'KARRADA', 'NEW_BAGHDAD', 'AL_RASHID']
            },
            minItems: 1
          },
          address: { type: 'string', nullable: true }
        }
      },
      response: {
        201: {
          description: 'Shop owner created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                businessName: { type: 'string' },
                phone: { type: 'string' },
                role: { type: 'string' },
                zones: { type: 'array', items: { type: 'string' } }
              }
            },
            credentials: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                password: { type: 'string' },
                loginUrl: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'List all companies',
      description: 'Retrieve a list of all registered companies in the system. Returns company details including name, status, and associated metadata.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of companies retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            companies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Unique identifier of the company (UUID)' },
                  name: { type: 'string', description: 'Company name' },
                  email: { type: 'string', description: 'Company contact email' },
                  phone: { type: 'string', nullable: true, description: 'Company phone number' },
                  address: { type: 'string', nullable: true, description: 'Company address' },
                  isActive: { type: 'boolean', description: 'Whether the company is active' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the company was created' },
                  updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the company was last updated' }
                }
              },
              description: 'Array of company objects'
            },
            total: { type: 'integer', description: 'Total number of companies returned' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Create a new company',
      description: 'Create a new company in the system. Companies are the top-level organizational unit that vendors and company managers are assigned to.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, description: 'Company name, e.g. Acme Corporation' },
          email: { type: 'string', format: 'email', description: 'Company contact email, e.g. contact@acme.com' },
          phone: { type: 'string', nullable: true, description: 'Company phone number, e.g. +964-770-123-4567' },
          address: { type: 'string', nullable: true, description: 'Company physical address' },
          description: { type: 'string', nullable: true, description: 'Brief description of the company' }
        }
      },
      response: {
        201: {
          description: 'Company created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            company: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier of the created company (UUID)' },
                name: { type: 'string', description: 'Company name' },
                email: { type: 'string', description: 'Company contact email' },
                phone: { type: 'string', nullable: true, description: 'Company phone number' },
                address: { type: 'string', nullable: true, description: 'Company address' },
                isActive: { type: 'boolean', description: 'Whether the company is active (defaults to true)' },
                createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the company was created' },
                updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the company was last updated' }
              }
            },
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          description: 'Bad request - validation error or company name already exists',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Detailed error message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'List all users',
      description: 'Retrieve a list of all users in the system. Optionally filter by role using query parameter.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['VENDOR', 'SHOP_OWNER', 'COMPANY_MANAGER', 'INTERNAL'],
            description: 'Filter users by role. Valid values: VENDOR, SHOP_OWNER, COMPANY_MANAGER, INTERNAL'
          }
        }
      },
      response: {
        200: {
          description: 'List of users retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Unique identifier of the user (UUID)' },
                  email: { type: 'string', description: 'User email address' },
                  name: { type: 'string', description: 'User full name' },
                  role: { type: 'string', description: 'User role (VENDOR, SHOP_OWNER, COMPANY_MANAGER, INTERNAL)' },
                  phone: { type: 'string', nullable: true, description: 'User phone number' },
                  businessName: { type: 'string', nullable: true, description: 'Business name (for SHOP_OWNER)' },
                  zones: { type: 'array', items: { type: 'string' }, description: 'Array of zones assigned to the user' },
                  companyId: { type: 'string', nullable: true, description: 'UUID of assigned company (for VENDOR and COMPANY_MANAGER)' },
                  isActive: { type: 'boolean', description: 'Whether the user account is active' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was created' },
                  updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was last updated' }
                }
              },
              description: 'Array of user objects'
            },
            total: { type: 'integer', description: 'Total number of users returned' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Deactivate a user',
      description: 'Deactivate a user account by ID. Deactivated users cannot log in or access the system until reactivated.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'UUID of the user to deactivate' }
        }
      },
      response: {
        200: {
          description: 'User deactivated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          description: 'Bad request - invalid user ID or user cannot be deactivated',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Detailed error message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        404: {
          description: 'Not found - user with specified ID does not exist',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Not found error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Activate a user',
      description: 'Activate a previously deactivated user account by ID. Once activated, the user can log in and access the system again.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'UUID of the user to activate' }
        }
      },
      response: {
        200: {
          description: 'User activated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          description: 'Bad request - invalid user ID or user cannot be activated',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Detailed error message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        404: {
          description: 'Not found - user with specified ID does not exist',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Not found error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Generate a secure password',
      description: 'Generate a cryptographically secure random password. Useful for creating user accounts with auto-generated passwords.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          length: {
            type: 'integer',
            minimum: 8,
            maximum: 32,
            default: 12,
            description: 'Length of the generated password. Defaults to 12 characters. Valid range: 8-32'
          }
        }
      },
      response: {
        200: {
          description: 'Password generated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            password: { type: 'string', description: 'The generated password' },
            message: { type: 'string', description: 'Success message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Get available zones',
      description: 'Retrieve a list of all available geographic zones in the system. Zones are used to assign vendors and shop owners to specific areas.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of available zones retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            zones: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['KARKH', 'RUSAFA', 'SADR_CITY', 'KADHMIYA', 'ADHAMIYA', 'MANSOUR', 'ZAFARANIYA', 'KARRADA', 'NEW_BAGHDAD', 'AL_RASHID']
              },
              description: 'Array of available zone identifiers'
            },
            message: { type: 'string', description: 'Informational message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return reply.send({
      success: true,
      zones: Object.values(Zone),
      message: 'Available zones'
    });
  });

  // Get available roles - Protected endpoint
  fastify.get('/roles', {
    preHandler: [authenticateInternal],
    schema: {
      tags: ['internal'],
      summary: 'Get available roles',
      description: 'Retrieve a list of all available user roles in the system, categorized by platform (dashboard or mobile). Use this to determine which roles can be assigned when creating new users.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of available roles retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            roles: {
              type: 'object',
              properties: {
                dashboard: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['VENDOR', 'COMPANY_MANAGER']
                  },
                  description: 'Roles that can access the web dashboard'
                },
                mobile: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['SHOP_OWNER']
                  },
                  description: 'Roles that can access the mobile app'
                }
              },
              description: 'Object containing roles grouped by platform'
            },
            message: { type: 'string', description: 'Informational message' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing authentication token',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authentication error message' }
          }
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Authorization error message' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error type identifier' },
            message: { type: 'string', description: 'Server error message' }
          }
        }
      }
    }
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