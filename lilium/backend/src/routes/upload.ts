import { FastifyPluginAsync } from 'fastify';
import { UploadService } from '../services/upload.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  const uploadService = new UploadService(fastify);

  // Upload single file
  fastify.post('/single', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
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
  }, async (request, reply) => {
    try {
      const files = await request.saveRequestFiles();

      if (!files || files.length === 0) {
        return reply.code(400).send({ error: 'No files provided' });
      }

      const urls = await uploadService.uploadMultipleFiles(files);

      return reply.send({
        success: true,
        urls,
        count: urls.length,
        message: `${urls.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'File upload failed',
      });
    }
  });

  // Delete file
  fastify.delete('/:filename', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
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
