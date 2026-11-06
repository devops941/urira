import multer from 'multer';

// Use memory storage so image buffer is processed directly without saving to local disk
const storage = multer.memoryStorage();

export const uploadAvatarMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are supported.'));
    }
  },
});

