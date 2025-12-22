import { FastifyInstance } from 'fastify';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnUrl?: string;
}

export class S3Service {
  private s3Client: S3Client | null = null;
  private bucket: string = '';
  private cdnUrl: string = '';
  private enabled: boolean = false;

  constructor(private fastify: FastifyInstance) {
    this.initialize();
  }

  private initialize() {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      this.fastify.log.warn('AWS S3 credentials not configured. S3 upload disabled.');
      return;
    }

    try {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      this.bucket = bucket;
      this.cdnUrl = process.env.AWS_CDN_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
      this.enabled = true;

      this.fastify.log.info('AWS S3 service initialized successfully');
    } catch (error: any) {
      this.fastify.log.error('Failed to initialize S3 client:', error.message);
    }
  }

  /**
   * Check if S3 is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get CDN URL for a key
   */
  getCdnUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<string> {
    if (!this.enabled || !this.s3Client) {
      throw new Error('S3 service is not enabled');
    }

    const ext = path.extname(filename);
    const key = `${folder}/${randomUUID()}${ext}`;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
          CacheControl: 'max-age=31536000', // 1 year cache
        },
      });

      await upload.done();

      this.fastify.log.info(`File uploaded to S3: ${key}`);
      return this.getCdnUrl(key);
    } catch (error: any) {
      this.fastify.log.error('S3 upload error:', error.message);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
    folder: string = 'uploads'
  ): Promise<string[]> {
    const uploads = files.map((file) =>
      this.uploadFile(file.buffer, file.filename, file.mimeType, folder)
    );

    return Promise.all(uploads);
  }

  /**
   * Delete file from S3
   */
  async deleteFile(url: string): Promise<boolean> {
    if (!this.enabled || !this.s3Client) {
      return false;
    }

    try {
      // Extract key from URL
      const key = url.replace(this.cdnUrl + '/', '');

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      this.fastify.log.info(`File deleted from S3: ${key}`);
      return true;
    } catch (error: any) {
      this.fastify.log.error('S3 delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMultipleFiles(urls: string[]): Promise<number> {
    let deleted = 0;
    for (const url of urls) {
      if (await this.deleteFile(url)) {
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Generate presigned URL for direct upload
   */
  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    folder: string = 'uploads',
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    if (!this.enabled || !this.s3Client) {
      throw new Error('S3 service is not enabled');
    }

    const ext = path.extname(filename);
    const key = `${folder}/${randomUUID()}${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
        CacheControl: 'max-age=31536000',
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        uploadUrl,
        fileUrl: this.getCdnUrl(key),
        key,
      };
    } catch (error: any) {
      this.fastify.log.error('S3 presigned URL error:', error.message);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Generate presigned URL for download
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.enabled || !this.s3Client) {
      throw new Error('S3 service is not enabled');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      this.fastify.log.error('S3 presigned download URL error:', error.message);
      throw new Error('Failed to generate presigned download URL');
    }
  }
}
