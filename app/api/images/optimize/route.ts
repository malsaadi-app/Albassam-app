/**
 * Image Optimization API
 * POST /api/images/optimize
 * 
 * Optimizes uploaded images:
 * - Converts to WebP
 * - Resizes to max dimensions
 * - Generates thumbnail
 * - Returns optimized URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { optimizeImage, generateThumbnail, IMAGE_SETTINGS } from '@/lib/image-utils';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 }
      );
    }

    // Create temp directory if not exists
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }

    // Save temp file
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}-${randomId}`;
    const tempPath = path.join(tempDir, `${fileName}.original`);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(tempPath, Buffer.from(arrayBuffer));

    // Optimize image
    const optimized = await optimizeImage(tempPath, undefined, {
      maxWidth: IMAGE_SETTINGS.MAX_WIDTH,
      maxHeight: IMAGE_SETTINGS.MAX_HEIGHT,
      quality: IMAGE_SETTINGS.QUALITY.MEDIUM,
      format: 'webp',
    });

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(tempPath, IMAGE_SETTINGS.THUMBNAIL_SIZE);

    // Move to uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'optimized');
    await fs.mkdir(uploadsDir, { recursive: true });

    const finalPath = path.join(uploadsDir, `${fileName}.webp`);
    const finalThumbPath = path.join(uploadsDir, `${fileName}.thumb.webp`);

    await fs.rename(optimized.path, finalPath);
    await fs.rename(thumbnailPath, finalThumbPath);

    // Clean up temp file
    await fs.unlink(tempPath);

    // Get file sizes
    const originalSize = file.size;
    const optimizedSize = (await fs.stat(finalPath)).size;
    const savedBytes = originalSize - optimizedSize;
    const savedPercent = Math.round((savedBytes / originalSize) * 100);

    return NextResponse.json({
      success: true,
      data: {
        original: {
          size: originalSize,
          type: file.type,
          name: file.name,
        },
        optimized: {
          url: `/uploads/optimized/${fileName}.webp`,
          size: optimizedSize,
          width: optimized.width,
          height: optimized.height,
        },
        thumbnail: {
          url: `/uploads/optimized/${fileName}.thumb.webp`,
          size: (await fs.stat(finalThumbPath)).size,
        },
        savings: {
          bytes: savedBytes,
          percent: savedPercent,
        },
      },
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to optimize image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Usage from client:
 * 
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * 
 * const response = await fetch('/api/images/optimize', {
 *   method: 'POST',
 *   body: formData,
 * });
 * 
 * const result = await response.json();
 * console.log('Optimized URL:', result.data.optimized.url);
 * console.log('Saved:', result.data.savings.percent, '%');
 */
