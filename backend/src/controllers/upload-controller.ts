import type { Request, Response } from 'express';
import { optimizeImage, getExtensionForFormat, deleteImage } from '../utils/image-optimizer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Upload article image
 */
export async function uploadArticleImage(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Optimize the uploaded image
    const uploadedPath = req.file.path;
    const fileName = path.basename(uploadedPath, path.extname(uploadedPath));
    const outputPath = path.join(
      path.dirname(uploadedPath),
      `${fileName}${getExtensionForFormat('webp')}`
    );

    const optimizedImage = await optimizeImage(uploadedPath, outputPath, {
      width: 1200,
      height: 630,
      quality: 85,
      format: 'webp',
    });

    // Generate full image URL with backend server address
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/articles/${path.basename(optimizedImage.path)}`;

    logger.info(`Article image uploaded by user ${userId}: ${imageUrl}`);

    return res.json({
      imageUrl,
      size: optimizedImage.size,
      width: optimizedImage.width,
      height: optimizedImage.height,
    });
  } catch (error) {
    logger.error(`uploadArticleImage: ${(error as Error).message}`);
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}

/**
 * Delete article image
 */
export async function deleteArticleImage(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    // Extract filename from URL (e.g., /uploads/articles/article-123.webp -> article-123.webp)
    const filename = path.basename(imageUrl);
    const imagePath = path.join(__dirname, '../../uploads/articles', filename);

    // Check if file exists and delete it
    if (fs.existsSync(imagePath)) {
      deleteImage(imagePath);
      logger.info(`Article image deleted by user ${userId}: ${imageUrl}`);
      return res.json({ message: 'Image deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    logger.error(`deleteArticleImage: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
}
