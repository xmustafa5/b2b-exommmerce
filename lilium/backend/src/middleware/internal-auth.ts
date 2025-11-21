import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware to authenticate internal Lilium team requests
 */
export const authenticateInternal = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = await request.server.jwt.verify(token) as any;

    // Check if this is an internal token
    if (!decoded.isInternal || decoded.email !== 'lilium@lilium.iq') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'This endpoint is for internal use only'
      });
    }

    // Add decoded token to request
    (request as any).internal = decoded;
  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};