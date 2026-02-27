/**
 * Image Utilities
 * 
 * Helper functions for image processing:
 * - Resize and compress images
 * - Convert to WebP format
 * - Generate thumbnails
 * - Create blur placeholders
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

// Image optimization settings
export const IMAGE_SETTINGS = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
  THUMBNAIL_SIZE: 256,
  AVATAR_SIZE: 128,
  QUALITY: {
    HIGH: 90,
    MEDIUM: 80,
    LOW: 60,
  },
  FORMATS: {
    WEBP: 'webp' as const,
    JPEG: 'jpeg' as const,
    PNG: 'png' as const,
  },
};

/**
 * Optimize image file
 * Resize to max dimensions and convert to WebP
 */
export async function optimizeImage(
  inputPath: string,
  outputPath?: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<{ path: string; size: number; width: number; height: number }> {
  const {
    maxWidth = IMAGE_SETTINGS.MAX_WIDTH,
    maxHeight = IMAGE_SETTINGS.MAX_HEIGHT,
    quality = IMAGE_SETTINGS.QUALITY.MEDIUM,
    format = IMAGE_SETTINGS.FORMATS.WEBP,
  } = options;

  // Default output path: same name with .webp extension
  const output =
    outputPath ||
    inputPath.replace(/\.[^.]+$/, `.optimized.${format}`);

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Resize if needed
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > maxWidth || metadata.height > maxHeight)
  ) {
    image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert format and optimize
  switch (format) {
    case 'webp':
      await image.webp({ quality }).toFile(output);
      break;
    case 'jpeg':
      await image.jpeg({ quality, mozjpeg: true }).toFile(output);
      break;
    case 'png':
      await image.png({ quality, compressionLevel: 9 }).toFile(output);
      break;
  }

  const stats = await fs.stat(output);
  const outputMetadata = await sharp(output).metadata();

  return {
    path: output,
    size: stats.size,
    width: outputMetadata.width || 0,
    height: outputMetadata.height || 0,
  };
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(
  inputPath: string,
  size: number = IMAGE_SETTINGS.THUMBNAIL_SIZE
): Promise<string> {
  const outputPath = inputPath.replace(
    /\.[^.]+$/,
    `.thumb-${size}.webp`
  );

  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: IMAGE_SETTINGS.QUALITY.MEDIUM })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Generate avatar (square, optimized for profile photos)
 */
export async function generateAvatar(
  inputPath: string,
  size: number = IMAGE_SETTINGS.AVATAR_SIZE
): Promise<string> {
  const outputPath = inputPath.replace(
    /\.[^.]+$/,
    `.avatar-${size}.webp`
  );

  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: IMAGE_SETTINGS.QUALITY.HIGH })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Generate blur placeholder (base64 data URL)
 * Tiny 10x10 image for loading state
 */
export async function generateBlurPlaceholder(
  inputPath: string
): Promise<string> {
  const buffer = await sharp(inputPath)
    .resize(10, 10, { fit: 'inside' })
    .blur(2)
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  inputPath: string
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(inputPath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Convert image to WebP format
 */
export async function convertToWebP(
  inputPath: string,
  quality: number = IMAGE_SETTINGS.QUALITY.MEDIUM
): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.webp');

  await sharp(inputPath)
    .webp({ quality })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Batch optimize images in a directory
 */
export async function optimizeDirectory(
  dirPath: string,
  options: Parameters<typeof optimizeImage>[2] = {}
): Promise<Array<{ original: string; optimized: string; savedBytes: number }>> {
  const files = await fs.readdir(dirPath);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png)$/i.test(file)
  );

  const results = [];

  for (const file of imageFiles) {
    const filePath = path.join(dirPath, file);
    const originalStats = await fs.stat(filePath);

    const result = await optimizeImage(filePath, undefined, options);

    results.push({
      original: filePath,
      optimized: result.path,
      savedBytes: originalStats.size - result.size,
    });
  }

  return results;
}

/**
 * Clean up old optimized images (older than N days)
 */
export async function cleanupOldImages(
  dirPath: string,
  daysOld: number = 30
): Promise<number> {
  const files = await fs.readdir(dirPath);
  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const file of files) {
    if (!/\.(optimized|thumb|avatar)\./i.test(file)) continue;

    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      await fs.unlink(filePath);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Usage Examples:
 * 
 * 1. Optimize uploaded image:
 * const result = await optimizeImage('/uploads/photo.jpg', undefined, {
 *   maxWidth: 1920,
 *   quality: 80,
 *   format: 'webp'
 * });
 * 
 * 2. Generate thumbnail:
 * const thumbPath = await generateThumbnail('/uploads/photo.jpg', 256);
 * 
 * 3. Generate avatar:
 * const avatarPath = await generateAvatar('/uploads/employee.jpg', 128);
 * 
 * 4. Get blur placeholder:
 * const blurDataURL = await generateBlurPlaceholder('/uploads/photo.jpg');
 * 
 * 5. Batch optimize:
 * const results = await optimizeDirectory('./public/uploads', {
 *   quality: 80,
 *   format: 'webp'
 * });
 */

/**
 * NOTE: This requires the 'sharp' package
 * Install with: npm install sharp
 * Sharp is a high-performance image processing library
 */
