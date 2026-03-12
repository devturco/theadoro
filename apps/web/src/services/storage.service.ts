import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
}

export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: Error | null;
}

export interface DeleteResult {
  error: Error | null;
}

class StorageService {
  private readonly buckets = {
    PRODUCTS: 'products',
    AVATARS: 'avatars',
    CATEGORIES: 'categories',
    DOCUMENTS: 'documents',
    CMS: 'cms'
  } as const;

  /**
   * Upload CMS image
   */
  async uploadCMSImage(file: File): Promise<UploadResult> {
    const path = this.generateFilePath('hero', file.name);

    return this.uploadFile({
      bucket: this.buckets.CMS,
      path,
      file,
      upsert: true
    });
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const { bucket, path, file, upsert = false } = options;

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          data: null,
          error: new Error(validation.error)
        };
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert,
          cacheControl: '3600'
        });

      if (error) {
        return {
          data: null,
          error: new Error(error.message)
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: publicUrlData.publicUrl
        },
        error: null
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        data: null,
        error: error as Error
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    bucket: string,
    files: File[],
    pathPrefix: string = ''
  ): Promise<{ results: UploadResult[]; errors: Error[] }> {
    const results: UploadResult[] = [];
    const errors: Error[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const path = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

      const result = await this.uploadFile({
        bucket,
        path,
        file
      });

      results.push(result);

      if (result.error) {
        errors.push(result.error);
      }
    }

    return { results, errors };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<DeleteResult> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return {
        error: error ? new Error(error.message) : null
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        error: error as Error
      };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(bucket: string, paths: string[]): Promise<DeleteResult> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      return {
        error: error ? new Error(error.message) : null
      };
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      return {
        error: error as Error
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return {
          data: null,
          error: new Error(error.message)
        };
      }

      return {
        data: { signedUrl: data.signedUrl },
        error: null
      };
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return {
        data: null,
        error: error as Error
      };
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(
    bucket: string,
    path: string = '',
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    } = {}
  ): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy
        });

      if (error) {
        return {
          data: null,
          error: new Error(error.message)
        };
      }

      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error listing files:', error);
      return {
        data: null,
        error: error as Error
      };
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate unique file path
   */
  generateFilePath(
    folder: string,
    fileName: string,
    userId?: string
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

    const sanitizedName = nameWithoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const uniqueName = `${sanitizedName}-${timestamp}-${randomString}.${extension}`;

    if (userId) {
      return `${folder}/${userId}/${uniqueName}`;
    }

    return `${folder}/${uniqueName}`;
  }

  /**
   * Product image upload helper
   */
  async uploadProductImage(
    file: File,
    productId: string,
    sellerId: string
  ): Promise<UploadResult> {
    const path = this.generateFilePath('products', file.name, sellerId);

    return this.uploadFile({
      bucket: this.buckets.PRODUCTS,
      path,
      file
    });
  }

  /**
   * Upload multiple product images
   */
  async uploadProductImages(
    files: File[],
    productId: string,
    sellerId: string
  ): Promise<{ results: UploadResult[]; errors: Error[] }> {
    return this.uploadMultipleFiles(
      this.buckets.PRODUCTS,
      files,
      `products/${sellerId}`
    );
  }

  /**
   * Avatar upload helper
   */
  async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    const path = this.generateFilePath('avatars', file.name, userId);

    return this.uploadFile({
      bucket: this.buckets.AVATARS,
      path,
      file,
      upsert: true // Allow overwriting existing avatar
    });
  }

  /**
   * Category image upload helper
   */
  async uploadCategoryImage(file: File, categoryId: string): Promise<UploadResult> {
    const path = this.generateFilePath('categories', file.name);

    return this.uploadFile({
      bucket: this.buckets.CATEGORIES,
      path,
      file
    });
  }

  /**
   * Document upload helper
   */
  async uploadDocument(
    file: File,
    userId: string,
    documentType: string
  ): Promise<UploadResult> {
    const path = this.generateFilePath(`documents/${documentType}`, file.name, userId);

    return this.uploadFile({
      bucket: this.buckets.DOCUMENTS,
      path,
      file
    });
  }

  /**
   * Extract file path from URL
   */
  extractPathFromUrl(url: string, bucket: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === bucket);

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }

  /**
   * Delete product images
   */
  async deleteProductImages(imageUrls: string[]): Promise<DeleteResult> {
    const paths = imageUrls
      .map(url => this.extractPathFromUrl(url, this.buckets.PRODUCTS))
      .filter(Boolean) as string[];

    if (paths.length === 0) {
      return { error: null };
    }

    return this.deleteMultipleFiles(this.buckets.PRODUCTS, paths);
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(avatarUrl: string): Promise<DeleteResult> {
    const path = this.extractPathFromUrl(avatarUrl, this.buckets.AVATARS);

    if (!path) {
      return { error: new Error('Invalid avatar URL') };
    }

    return this.deleteFile(this.buckets.AVATARS, path);
  }

  /**
   * Get bucket names
   */
  getBuckets() {
    return this.buckets;
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, path: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'));

      if (error) {
        return false;
      }

      const fileName = path.split('/').pop();
      return data?.some(file => file.name === fileName) || false;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: string, path: string): Promise<{ data: any | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'));

      if (error) {
        return {
          data: null,
          error: new Error(error.message)
        };
      }

      const fileName = path.split('/').pop();
      const fileData = data?.find(file => file.name === fileName);

      return {
        data: fileData || null,
        error: null
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return {
        data: null,
        error: error as Error
      };
    }
  }
}

export const storageService = new StorageService();