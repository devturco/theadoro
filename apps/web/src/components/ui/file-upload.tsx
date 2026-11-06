import { useState, useRef, useCallback } from 'react';
import { Button } from '@theadoro/ui';
import { Progress } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  File,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { FileUploadOptions } from '@/types/common';

interface FileUploadProps {
  onUpload: (urls: string[]) => void;
  options?: Partial<FileUploadOptions>;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  /** Tamanho máximo por arquivo, em bytes. */
  maxSize?: number;
  preview?: boolean;
  className?: string;
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
}

export const FileUpload = ({
  onUpload,
  options = {},
  multiple = false,
  accept = 'image/*',
  maxFiles = 5,
  maxSize,
  preview = true,
  className,
  disabled = false
}: FileUploadProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploading, progress, uploadFile, uploadMultipleFiles } = useFileUpload();

  const defaultOptions: FileUploadOptions = {
    bucket: 'products',
    folder: 'uploads',
    maxSize: maxSize ?? 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...options
  };

  const validateFile = (file: File): string | null => {
    if (file.size > defaultOptions.maxSize!) {
      return `Arquivo muito grande: ${file.name} (máx: ${defaultOptions.maxSize! / 1024 / 1024}MB)`;
    }

    if (!defaultOptions.allowedTypes!.includes(file.type)) {
      return `Tipo não permitido: ${file.name}`;
    }

    return null;
  };

  const createPreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];
    const newErrors: string[] = [];

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Máximo de ${maxFiles} arquivos permitidos`);
      setErrors(newErrors);
      return;
    }

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        const fileWithPreview = file as FileWithPreview;
        if (preview && file.type.startsWith('image/')) {
          fileWithPreview.preview = createPreview(file);
        }
        validFiles.push(fileWithPreview);
      }
    });

    setErrors(newErrors);
    setFiles(prev => [...prev, ...validFiles]);
  }, [files.length, maxFiles, preview]);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      
      // Revoke object URL to prevent memory leaks
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      let urls: string[];
      
      if (multiple && files.length > 1) {
        urls = await uploadMultipleFiles(files, defaultOptions);
      } else {
        const url = await uploadFile(files[0], defaultOptions);
        urls = [url];
      }

      onUpload(urls);
      setFiles([]);
      setErrors([]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-wine-500 bg-wine-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-wine-400 cursor-pointer'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Clique para enviar ou arraste arquivos aqui
        </p>
        <p className="text-sm text-gray-500">
          {accept === 'image/*' ? 'Imagens' : 'Arquivos'} até {defaultOptions.maxSize! / 1024 / 1024}MB
          {multiple && ` (máx: ${maxFiles} arquivos)`}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded">
                    {getFileIcon(file)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <Badge variant="outline">
                  {file.type.split('/')[1].toUpperCase()}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando arquivos...</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
};