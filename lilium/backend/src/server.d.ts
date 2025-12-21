import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}
//# sourceMappingURL=server.d.ts.map