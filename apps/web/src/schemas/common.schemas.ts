import { z } from 'zod';

// Pagination Options Schema
export const paginationOptionsSchema = z.object({
  page: z.number().int().min(1, 'Página deve ser maior que zero'),
  pageSize: z.number().int().min(1, 'Tamanho da página deve ser maior que zero').max(100, 'Tamanho da página deve ser no máximo 100'),
  total: z.number().int().min(0, 'Total deve ser maior ou igual a zero'),
  totalPages: z.number().int().min(0, 'Total de páginas deve ser maior ou igual a zero'),
});

// Paginated Response Schema
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: paginationOptionsSchema,
  });

// API Response Schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().optional(),
    message: z.string().optional(),
  });

// CRUD Options Schema
export const crudOptionsSchema = <T extends z.ZodTypeAny>(tableSchema: T) =>
  z.object({
    table: z.string().min(1, 'Nome da tabela é obrigatório'),
    select: z.string().optional(),
    orderBy: z.object({
      column: z.string().min(1, 'Coluna de ordenação é obrigatória'),
      ascending: z.boolean().optional(),
    }).optional(),
    filters: z.record(z.string(), z.any()).optional(),
    realtime: z.boolean().optional(),
  });

// Upload Options Schema
export const uploadOptionsSchema = z.object({
  bucket: z.string().min(1, 'Nome do bucket é obrigatório'),
  folder: z.string().optional(),
  maxSize: z.number().min(0.1, 'Tamanho máximo deve ser maior que 0.1 MB').max(50, 'Tamanho máximo deve ser no máximo 50 MB').optional(),
  allowedTypes: z.array(z.string()).optional(),
  multiple: z.boolean().optional(),
});

// Metric Data Schema
export const metricDataSchema = z.object({
  title: z.string().min(1, 'Título da métrica é obrigatório'),
  value: z.union([z.string(), z.number()]),
  change: z.string().optional(),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  color: z.enum(['blue', 'green', 'purple', 'orange', 'red']).optional(),
});

// Form Field Schema
export const formFieldSchema = z.object({
  name: z.string().min(1, 'Nome do campo é obrigatório'),
  label: z.string().min(1, 'Label do campo é obrigatório'),
  type: z.enum(['text', 'email', 'password', 'number', 'textarea', 'select', 'file', 'checkbox', 'date', 'time']),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  validation: z.any().optional(),
  description: z.string().optional(),
});

// Search Filters Schema
export const searchFiltersSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

// Date Range Schema
export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
}).refine((data) => data.from <= data.to, {
  message: 'Data inicial deve ser anterior ou igual à data final',
  path: ['to'],
});

// File Upload Schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Arquivo é obrigatório' }),
  folder: z.string().optional(),
  bucket: z.string().default('products'),
}).refine((data) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(data.file.type);
}, {
  message: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF',
  path: ['file'],
}).refine((data) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return data.file.size <= maxSize;
}, {
  message: 'Arquivo muito grande. Tamanho máximo: 5MB',
  path: ['file'],
});

// Bulk Action Schema
export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate', 'approve', 'reject']),
  ids: z.array(z.string().uuid()).min(1, 'Pelo menos um item deve ser selecionado'),
  reason: z.string().optional(),
});

// Notification Schema
export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1, 'Título da notificação é obrigatório'),
  message: z.string().min(1, 'Mensagem da notificação é obrigatória'),
  type: z.enum(['info', 'success', 'warning', 'error']),
  read: z.boolean().default(false),
  created_at: z.string(),
});

// Create Notification Schema
export const createNotificationSchema = z.object({
  user_id: z.string().uuid('ID do usuário inválido'),
  title: z.string().min(1, 'Título da notificação é obrigatório'),
  message: z.string().min(1, 'Mensagem da notificação é obrigatória'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
});

// Export types
export type PaginationOptions = z.infer<typeof paginationOptionsSchema>;
export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationOptions;
};
export type ApiResponse<T> = {
  data: T;
  error?: string;
  message?: string;
};
export type UploadOptions = z.infer<typeof uploadOptionsSchema>;
export type MetricData = z.infer<typeof metricDataSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type BulkAction = z.infer<typeof bulkActionSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationData = z.infer<typeof createNotificationSchema>;