import sharp from 'sharp';
import fs from 'fs';

interface OptimizeImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Optimize and resize an image
 * @param inputPath - Path to the original image
 * @param outputPath - Path where the optimized image will be saved
 * @param options - Optimization options
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizeImageOptions = {}
): Promise<{ path: string; size: number; width: number; height: number }> {
  const { width = 400, height = 400, quality = 80, format = 'webp' } = options;

  try {
    // Process the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Resize and optimize
    let processedImage = image.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        processedImage = processedImage.webp({ quality });
        break;
      case 'jpeg':
        processedImage = processedImage.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        processedImage = processedImage.png({ quality, compressionLevel: 9 });
        break;
    }

    // Save the optimized image
    const info = await processedImage.toFile(outputPath);

    // Delete the original file if it's different from the output
    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    return {
      path: outputPath,
      size: info.size,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    // Clean up files on error
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw new Error(
      `Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete an image file
 * @param imagePath - Path to the image file
 */
export function deleteImage(imagePath: string): void {
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
}

/**
 * Get the file extension for a format
 */
export function getExtensionForFormat(format: 'jpeg' | 'png' | 'webp'): string {
  const extensions = {
    jpeg: '.jpg',
    png: '.png',
    webp: '.webp',
  };
  return extensions[format];
}
