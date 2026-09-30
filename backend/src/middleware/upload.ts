import type { Request } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directories exist
const avatarDir = path.join(__dirname, '../../uploads/avatars');
const articleDir = path.join(__dirname, '../../uploads/articles');

[avatarDir, articleDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Raw uploads are re-encoded to WebP next to themselves and then deleted. A fixed extension keeps
 * the output path distinct from the input, and keeps the browser-supplied name out of the public
 * uploads folder.
 */
const RAW_EXT = '.upload';

// Storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${RAW_EXT}`);
  },
});

// Storage for article images
const articleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, articleDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `article-${uniqueSuffix}${RAW_EXT}`);
  },
});

// File filter to only accept images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

// Configure multer for avatars
export const upload = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Configure multer for article images
export const articleUpload = multer({
  storage: articleStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
