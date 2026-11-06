export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Alias mantido para os hooks de CRUD, que usam `pageSize`. */
export type PaginationParams = PaginationOptions;

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

/** Operações devolvidas por `useCRUD`. */
export interface CRUDOperations<T> {
  create: (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Promise<T | null>;
  refresh: () => void;
  changePage: (page: number) => void;
  search: (filters: Record<string, any>) => void;
}

/** Opções do `useFileUpload` / `<FileUpload>`. */
export interface FileUploadOptions {
  bucket?: string;
  folder?: string;
  fileName?: string;
  /** Tamanho máximo em bytes. */
  maxSize?: number;
  allowedTypes?: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
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

/** Campo do `<GenericForm>` (packages/ui). */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'date' | 'time' | 'file' | 'boolean';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  description?: string;
  /** Linhas do textarea. */
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
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