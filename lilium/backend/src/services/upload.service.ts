import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export class UploadService {
  private fastify: FastifyInstance;
  private uploadDir: string;
  private allowedMimeTypes: string[];
  private maxFileSize: number;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.uploadDir = path.join(process.cwd(), 'uploads');
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

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: MultipartFile): Promise<string> {
    // Validate file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Generate unique filename
    const ext = path.extname(file.filename);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Save file
    const buffer = await file.toBuffer();

    // Check file size
    if (buffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    await fs.writeFile(filepath, buffer);

    // Return public URL
    return `/uploads/${filename}`;
  }

  async uploadMultipleFiles(files: MultipartFile[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      this.fastify.log.error(`Failed to delete file ${filename}:`, error);
    }
  }

  async deleteFiles(filenames: string[]): Promise<void> {
    const deletePromises = filenames.map(filename => this.deleteFile(filename));
    await Promise.all(deletePromises);
  }

  extractFilename(url: string): string {
    return path.basename(url);
  }
}
