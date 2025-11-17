// services/uploadPicService.ts
import cloudinary from '../config/cloudinary.js';

export class UploadService {
  // Upload profile picture
  static async uploadProfilePicture(file: string, userId: string) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: `profile-pictures/${userId}`,
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { format: 'webp' }
        ],
        public_id: `profile_${Date.now()}`,
        resource_type: 'image'
      });

      return {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      throw new Error('Upload failed: Unknown error occurred');
    }
  }

  // Delete profile picture
  static async deleteProfilePicture(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
      throw new Error('Delete failed: Unknown error occurred');
    }
  }

  // Update profile picture (delete old, upload new)
  static async updateProfilePicture(file: string, userId: string, oldPublicId: string | null = null) {
    try {
      // Delete old image if exists
      if (oldPublicId) {
        await this.deleteProfilePicture(oldPublicId);
      }

      // Upload new image
      return await this.uploadProfilePicture(file, userId);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Update failed: ${error.message}`);
      }
      throw new Error('Update failed: Unknown error occurred');
    }
  }

  // Get transformed URL for different sizes
  static getTransformedUrl(publicId: string, width: number = 300, height: number = 300) {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { format: 'webp' }
      ]
    });
  }
}

export default UploadService;