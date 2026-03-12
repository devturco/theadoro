import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FileUploadOptions, UploadProgress } from '@/types/common';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  });

  const uploadFile = useCallback(async (
    file: File,
    options: FileUploadOptions
  ): Promise<string> => {
    const {
      bucket = 'products',
      folder = '',
      fileName,
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    } = options;

    try {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`);
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
      }

      // Generate unique filename if not provided
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const finalFileName = fileName || `${timestamp}.${extension}`;
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      toast.success('Arquivo enviado com sucesso!');

      return publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar arquivo';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options: FileUploadOptions
  ): Promise<string[]> => {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadFile(file, {
          ...options,
          fileName: options.fileName ? `${options.fileName}_${i + 1}` : undefined
        });
        urls.push(url);
      } catch (error) {
        console.error(`Erro ao enviar arquivo ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return urls;
  }, [uploadFile]);

  const deleteFile = useCallback(async (
    filePath: string,
    bucket = 'products'
  ): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      toast.success('Arquivo removido com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover arquivo';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const getFileUrl = useCallback((
    filePath: string,
    bucket = 'products'
  ): string => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }, []);

  return {
    uploading,
    progress,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getFileUrl
  };
};