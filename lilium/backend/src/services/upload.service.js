"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
class UploadService {
    constructor(fastify) {
        this.fastify = fastify;
        this.uploadDir = path_1.default.join(process.cwd(), 'uploads');
        this.allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
        ];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.ensureUploadDir();
    }
    async ensureUploadDir() {
        try {
            await promises_1.default.access(this.uploadDir);
        }
        catch {
            await promises_1.default.mkdir(this.uploadDir, { recursive: true });
        }
    }
    async uploadFile(file) {
        // Validate file type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }
        // Generate unique filename
        const ext = path_1.default.extname(file.filename);
        const filename = `${(0, crypto_1.randomUUID)()}${ext}`;
        const filepath = path_1.default.join(this.uploadDir, filename);
        // Save file
        const buffer = await file.toBuffer();
        // Check file size
        if (buffer.length > this.maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
        }
        await promises_1.default.writeFile(filepath, buffer);
        // Return public URL
        return `/uploads/${filename}`;
    }
    async uploadMultipleFiles(files) {
        const uploadPromises = files.map(file => this.uploadFile(file));
        return Promise.all(uploadPromises);
    }
    async deleteFile(filename) {
        const filepath = path_1.default.join(this.uploadDir, filename);
        try {
            await promises_1.default.unlink(filepath);
        }
        catch (error) {
            this.fastify.log.error(`Failed to delete file ${filename}:`, error);
        }
    }
    async deleteFiles(filenames) {
        const deletePromises = filenames.map(filename => this.deleteFile(filename));
        await Promise.all(deletePromises);
    }
    extractFilename(url) {
        return path_1.default.basename(url);
    }
}
exports.UploadService = UploadService;
//# sourceMappingURL=upload.service.js.map