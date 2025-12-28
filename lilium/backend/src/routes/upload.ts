import { FastifyPluginAsync } from 'fastify';
import { UploadService } from '../services/upload.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  const uploadService = new UploadService(fastify);

  // Upload single file
  fastify.post('/single', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['upload'],
      summary: 'Upload a single file',
      description: 'Upload a single file (image). Supported formats: JPEG, PNG, WebP, GIF. Maximum file size: 5MB. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'The file to upload. Supported formats: image/jpeg, image/png, image/webp, image/gif. Maximum size: 5MB.'
          }
        }
      },
      response: {
        200: {
          description: 'File uploaded successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            url: { type: 'string', description: 'Public URL of the uploaded file, e.g. /uploads/abc123-def456.jpg' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - No file provided, invalid file type, or file size exceeded',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message describing the issue' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file provided' });
      }

      const url = await uploadService.uploadFile(data);

      return reply.send({
        success: true,
        url,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'File upload failed',
      });
    }
  });

  // Upload multiple files
  fastify.post('/multiple', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['upload'],
      summary: 'Upload multiple files',
      description: 'Upload multiple files (images) at once. Supported formats: JPEG, PNG, WebP, GIF. Maximum file size per file: 5MB. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        required: ['files'],
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary'
            },
            description: 'Array of files to upload. Supported formats: image/jpeg, image/png, image/webp, image/gif. Maximum size per file: 5MB.'
          }
        }
      },
      response: {
        200: {
          description: 'Files uploaded successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            urls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of public URLs for uploaded files'
            },
            count: { type: 'number', description: 'Number of files uploaded' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - No files provided, invalid file type, or file size exceeded',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message describing the issue' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const files = await request.saveRequestFiles();

      if (!files || files.length === 0) {
        return reply.code(400).send({ error: 'No files provided' });
      }

      // Use uploadMultipleSavedFiles for files saved via saveRequestFiles
      const urls = await uploadService.uploadMultipleSavedFiles(files);

      return reply.send({
        success: true,
        urls,
        count: urls.length,
        message: `${urls.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      fastify.log.error(error);
      // Clean up any temp files on error
      await request.cleanRequestFiles().catch(() => {});
      return reply.code(400).send({
        error: error.message || 'File upload failed',
      });
    }
  });

  // Delete file
  fastify.delete('/:filename', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['upload'],
      summary: 'Delete a file',
      description: 'Delete a previously uploaded file by its filename. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['filename'],
        properties: {
          filename: {
            type: 'string',
            description: 'The filename of the file to delete (including extension), e.g. abc123-def456.jpg'
          }
        }
      },
      response: {
        200: {
          description: 'File deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error - File deletion failed',
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message describing the issue' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { filename } = request.params;

      await uploadService.deleteFile(filename);

      return reply.send({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'File deletion failed',
      });
    }
  });
};

export default uploadRoutes;
