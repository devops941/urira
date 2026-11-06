import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ENV } from '../config/env.js';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image buffer directly to Cloudinary using upload_stream
 * Optimized for profile avatars (auto-faces, circular/square crop, webp format)
 */
export const uploadAvatarToCloudinary = (
  buffer: Buffer,
  userId: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'uyira/avatars',
        public_id: `user_${userId}_avatar`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'webp' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary image upload failed'));
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

export { cloudinary };

