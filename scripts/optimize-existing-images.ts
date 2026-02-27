/**
 * Optimize Existing Images Script
 * 
 * Run with: npx tsx scripts/optimize-existing-images.ts
 * 
 * This script:
 * - Finds all images in public/uploads
 * - Optimizes them to WebP format
 * - Generates thumbnails
 * - Reports savings
 */

import { optimizeImage, generateThumbnail, IMAGE_SETTINGS } from '../lib/image-utils';
import { promises as fs } from 'fs';
import path from 'path';

async function findImages(dir: string): Promise<string[]> {
  const results: string[] = [];

  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        // Recursive search
        const subResults = await findImages(filePath);
        results.push(...subResults);
      } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
        // Skip already optimized files
        if (!/\.(optimized|thumb|avatar)/.test(file)) {
          results.push(filePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return results;
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    await fs.access(uploadsDir);
  } catch {
    console.log('❌ No uploads directory found. Nothing to optimize.');
    return;
  }

  // Find all images
  console.log('📁 Scanning for images...');
  const images = await findImages(uploadsDir);
  console.log(`✓ Found ${images.length} images\n`);

  if (images.length === 0) {
    console.log('✅ No images to optimize.');
    return;
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let successCount = 0;
  let errorCount = 0;

  // Optimize each image
  for (let i = 0; i < images.length; i++) {
    const imagePath = images[i];
    const relativePath = path.relative(uploadsDir, imagePath);
    
    console.log(`[${i + 1}/${images.length}] ${relativePath}`);

    try {
      // Get original size
      const originalStats = await fs.stat(imagePath);
      totalOriginalSize += originalStats.size;

      // Optimize
      const result = await optimizeImage(imagePath, undefined, {
        maxWidth: IMAGE_SETTINGS.MAX_WIDTH,
        maxHeight: IMAGE_SETTINGS.MAX_HEIGHT,
        quality: IMAGE_SETTINGS.QUALITY.MEDIUM,
        format: 'webp',
      });

      totalOptimizedSize += result.size;

      // Generate thumbnail
      await generateThumbnail(imagePath, IMAGE_SETTINGS.THUMBNAIL_SIZE);

      const savedBytes = originalStats.size - result.size;
      const savedPercent = Math.round((savedBytes / originalStats.size) * 100);

      console.log(`  ✓ Optimized: ${formatBytes(originalStats.size)} → ${formatBytes(result.size)} (saved ${savedPercent}%)`);
      successCount++;
    } catch (error) {
      console.log(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
    }

    console.log('');
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 Summary:');
  console.log('═'.repeat(60));
  console.log(`Total images:       ${images.length}`);
  console.log(`Successful:         ${successCount} ✓`);
  console.log(`Failed:             ${errorCount} ${errorCount > 0 ? '✗' : ''}`);
  console.log(`Original size:      ${formatBytes(totalOriginalSize)}`);
  console.log(`Optimized size:     ${formatBytes(totalOptimizedSize)}`);
  console.log(`Total saved:        ${formatBytes(totalOriginalSize - totalOptimizedSize)} (${Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100)}%)`);
  console.log('═'.repeat(60));

  console.log('\n✅ Done!');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
