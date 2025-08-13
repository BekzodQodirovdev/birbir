import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    productId: string,
    productSlug?: string,
  ): Promise<{
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    file_path: string;
  }> {
    // File size validation
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Mime type validation
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    
    // Create product-specific directory path
    let productDir = this.uploadDir;
    if (productId) {
      // Create a directory structure like: uploads/productId/slug/
      const slugDir = productSlug ? productSlug : productId;
      productDir = path.join(this.uploadDir, productId, slugDir);
      
      // Ensure the product directory exists
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }
    }
    
    const filePath = path.join(productDir, filename);

    // Process image with sharp
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    // Resize if too large (max 1920x1080)
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > 1920 || metadata.height > 1080)
    ) {
      image.resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });
    }

    // Save processed image
    await image.toFile(filePath);

    return {
      filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      width: metadata.width || 0,
      height: metadata.height || 0,
      file_path: filePath,
    };
  }

  async deleteImage(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getImageUrl(filename: string): string {
    const appUrl = process.env.APP_URL || 'http://localhost:4000';
    return `${appUrl}/uploads/${filename}`;
  }
}
