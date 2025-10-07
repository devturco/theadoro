export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationOptions;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface CRUDOptions<T> {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Record<string, any>;
  realtime?: boolean;
}

export interface CRUDResult<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  create: (item: Partial<T>) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  refresh: () => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // MB
  allowedTypes?: string[];
  multiple?: boolean;
}

export interface UploadResult {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadFiles: (files: FileList | File[]) => Promise<string[]>;
  deleteFile: (url: string) => Promise<void>;
}

export interface MetricData {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'file' | 'checkbox' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
  description?: string;
}