import sharp from 'sharp';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

const CACHE_DIR = path.join(process.cwd(), '.image-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export interface OptimizedImage {
  url: string;
  webp: string;
  avif: string;
  width: number;
  height: number;
}

/**
 * Optimize image from URL and return multiple formats
 * @param imageUrl - Original image URL
 * @param width - Target width
 * @param height - Target height
 * @returns Optimized image URLs
 */
export async function optimizeImage(
  imageUrl: string,
  width: number = 800,
  height: number = 600
): Promise<OptimizedImage> {
  try {
    // Generate cache key from URL
    const cacheKey = Buffer.from(imageUrl).toString('base64').slice(0, 32);
    const cachedPath = path.join(CACHE_DIR, cacheKey);

    // Check if already cached
    if (fs.existsSync(`${cachedPath}.json`)) {
      return JSON.parse(fs.readFileSync(`${cachedPath}.json`, 'utf-8'));
    }

    // Download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();

    // Generate optimized formats
    const jpegBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    const webpBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer();

    const avifBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .avif({ quality: 75 })
      .toBuffer();

    // Save to cache
    fs.writeFileSync(`${cachedPath}.jpg`, jpegBuffer);
    fs.writeFileSync(`${cachedPath}.webp`, webpBuffer);
    fs.writeFileSync(`${cachedPath}.avif`, avifBuffer);

    const result: OptimizedImage = {
      url: `/api/images/${cacheKey}.jpg`,
      webp: `/api/images/${cacheKey}.webp`,
      avif: `/api/images/${cacheKey}.avif`,
      width: metadata.width || width,
      height: metadata.height || height,
    };

    // Cache metadata
    fs.writeFileSync(`${cachedPath}.json`, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Return original URL as fallback
    return {
      url: imageUrl,
      webp: imageUrl,
      avif: imageUrl,
      width,
      height,
    };
  }
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(baseUrl: string): string {
  const sizes = [320, 640, 960, 1280];
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
}

/**
 * Generate blur placeholder (LQIP - Low Quality Image Placeholder)
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const blurBuffer = await sharp(Buffer.from(response.data))
      .resize(20, 15, { fit: 'cover' })
      .blur(10)
      .toBuffer();

    return `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;
  } catch (error) {
    return '';
  }
}
