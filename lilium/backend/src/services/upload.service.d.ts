import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
export declare class UploadService {
    private fastify;
    private uploadDir;
    private allowedMimeTypes;
    private maxFileSize;
    constructor(fastify: FastifyInstance);
    private ensureUploadDir;
    uploadFile(file: MultipartFile): Promise<string>;
    uploadMultipleFiles(files: MultipartFile[]): Promise<string[]>;
    deleteFile(filename: string): Promise<void>;
    deleteFiles(filenames: string[]): Promise<void>;
    extractFilename(url: string): string;
}
//# sourceMappingURL=upload.service.d.ts.map