import { z } from 'zod';

// Product Type Schema
export const productTypeSchema = z.enum(['physical', 'service']);

// Category Schema
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome da categoria deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable(),
  image_url: z.string().url('URL da imagem inválida').nullable(),
  created_at: z.string(),
});

// Create Category Schema
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome da categoria deve ter pelo menos 2 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  image_url: z.string().url('URL da imagem inválida').optional(),
});

// Update Category Schema
export const updateCategorySchema = createCategorySchema.partial();

// Product Schema
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome do produto deve ter pelo menos 2 caracteres'),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres').nullable(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  images: z.array(z.string().url('URL da imagem inválida')),
  category_id: z.string().uuid().nullable(),
  seller_id: z.string().uuid(),
  is_active: z.boolean(),
  product_type: productTypeSchema,
  stock_quantity: z.number().int().min(0, 'Quantidade em estoque deve ser maior ou igual a zero').nullable(),
  featured: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Create Product Schema
export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome do produto deve ter pelo menos 2 caracteres'),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  images: z.array(z.string().url('URL da imagem inválida')).min(1, 'Pelo menos uma imagem é obrigatória'),
  category_id: z.string().uuid('ID da categoria inválido'),
  product_type: productTypeSchema,
  stock_quantity: z.number().int().min(0, 'Quantidade em estoque deve ser maior ou igual a zero').optional(),
});

// Update Product Schema
export const updateProductSchema = z.object({
  name: z.string().min(2, 'Nome do produto deve ter pelo menos 2 caracteres').optional(),
  description: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero').optional(),
  images: z.array(z.string().url('URL da imagem inválida')).optional(),
  category_id: z.string().uuid('ID da categoria inválido').optional(),
  product_type: productTypeSchema.optional(),
  stock_quantity: z.number().int().min(0, 'Quantidade em estoque deve ser maior ou igual a zero').optional(),
  is_active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// Product Filters Schema
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  seller_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  product_type: productTypeSchema.optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  featured: z.boolean().optional(),
});

// Review Schema
export const reviewSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Avaliação deve ser entre 1 e 5').max(5, 'Avaliação deve ser entre 1 e 5'),
  comment: z.string().max(1000, 'Comentário deve ter no máximo 1000 caracteres').nullable(),
  created_at: z.string(),
});

// Create Review Schema
export const createReviewSchema = z.object({
  product_id: z.string().uuid('ID do produto inválido'),
  rating: z.number().int().min(1, 'Avaliação deve ser entre 1 e 5').max(5, 'Avaliação deve ser entre 1 e 5'),
  comment: z.string().max(1000, 'Comentário deve ter no máximo 1000 caracteres').optional(),
});

// Update Review Schema
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Avaliação deve ser entre 1 e 5').max(5, 'Avaliação deve ser entre 1 e 5').optional(),
  comment: z.string().max(1000, 'Comentário deve ter no máximo 1000 caracteres').optional(),
});

// Service Availability Schema
export const serviceAvailabilitySchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  day_of_week: z.number().int().min(0, 'Dia da semana deve ser entre 0 e 6').max(6, 'Dia da semana deve ser entre 0 e 6'),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de início inválido (HH:MM)'),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fim inválido (HH:MM)'),
  created_at: z.string(),
});

// Create Service Availability Schema
const serviceAvailabilityObject = z.object({
  product_id: z.string().uuid('ID do produto inválido'),
  day_of_week: z.number().int().min(0, 'Dia da semana deve ser entre 0 e 6').max(6, 'Dia da semana deve ser entre 0 e 6'),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de início inválido (HH:MM)'),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fim inválido (HH:MM)'),
});

export const createServiceAvailabilitySchema = serviceAvailabilityObject.refine(
  (data) => data.start_time < data.end_time,
  {
    message: 'Horário de início deve ser anterior ao horário de fim',
    path: ['end_time'],
  }
);

// Update Service Availability Schema
export const updateServiceAvailabilitySchema = serviceAvailabilityObject
  .partial()
  .omit({ product_id: true });

// Export types
export type ProductType = z.infer<typeof productTypeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewData = z.infer<typeof createReviewSchema>;
export type UpdateReviewData = z.infer<typeof updateReviewSchema>;
export type ServiceAvailability = z.infer<typeof serviceAvailabilitySchema>;
export type CreateServiceAvailabilityData = z.infer<typeof createServiceAvailabilitySchema>;
export type UpdateServiceAvailabilityData = z.infer<typeof updateServiceAvailabilitySchema>;