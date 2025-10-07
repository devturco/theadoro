import { z } from 'zod';

// Order Status Schema
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

// Appointment Status Schema
export const appointmentStatusSchema = z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']);

// Order Schema
export const orderSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  total_amount: z.number().min(0, 'Valor total deve ser maior ou igual a zero'),
  status: orderStatusSchema,
  shipping_address: z.string().min(10, 'Endereço de entrega deve ter pelo menos 10 caracteres').nullable(),
  payment_method: z.string().min(2, 'Método de pagamento inválido').nullable(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Create Order Schema
export const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid('ID do produto inválido'),
    quantity: z.number().int().min(1, 'Quantidade deve ser maior que zero'),
    gift_message: z.string().max(200, 'Mensagem de presente deve ter no máximo 200 caracteres').optional(),
  })).min(1, 'Pelo menos um item é obrigatório'),
  shipping_address: z.string().min(10, 'Endereço de entrega deve ter pelo menos 10 caracteres'),
  payment_method: z.string().min(2, 'Método de pagamento é obrigatório'),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Update Order Schema
export const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  shipping_address: z.string().min(10, 'Endereço de entrega deve ter pelo menos 10 caracteres').optional(),
  payment_method: z.string().min(2, 'Método de pagamento inválido').optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Order Item Schema
export const orderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que zero'),
  unit_price: z.number().min(0, 'Preço unitário deve ser maior ou igual a zero'),
  gift_message: z.string().max(200, 'Mensagem de presente deve ter no máximo 200 caracteres').nullable(),
  created_at: z.string(),
});

// Appointment Schema
export const appointmentSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  appointment_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM'),
  service_address: z.string().min(10, 'Endereço do serviço deve ter pelo menos 10 caracteres').nullable(),
  status: appointmentStatusSchema,
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Create Appointment Schema
export const createAppointmentSchema = z.object({
  product_id: z.string().uuid('ID do produto inválido'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  appointment_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM'),
  service_address: z.string().min(10, 'Endereço do serviço deve ter pelo menos 10 caracteres').optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
}).refine((data) => {
  const appointmentDate = new Date(data.appointment_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return appointmentDate >= today;
}, {
  message: 'Data do agendamento deve ser hoje ou no futuro',
  path: ['appointment_date'],
});

// Update Appointment Schema
export const updateAppointmentSchema = z.object({
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  appointment_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM').optional(),
  service_address: z.string().min(10, 'Endereço do serviço deve ter pelo menos 10 caracteres').optional(),
  status: appointmentStatusSchema.optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Cart Schema
export const cartSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que zero'),
  created_at: z.string(),
});

// Add to Cart Schema
export const addToCartSchema = z.object({
  product_id: z.string().uuid('ID do produto inválido'),
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que zero').default(1),
});

// Update Cart Item Schema
export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que zero'),
});

// Wishlist Schema
export const wishlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  created_at: z.string(),
});

// Add to Wishlist Schema
export const addToWishlistSchema = z.object({
  product_id: z.string().uuid('ID do produto inválido'),
});

// Order Filters Schema
export const orderFiltersSchema = z.object({
  status: orderStatusSchema.optional(),
  buyer_id: z.string().uuid().optional(),
  seller_id: z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  min_amount: z.number().min(0).optional(),
  max_amount: z.number().min(0).optional(),
});

// Appointment Filters Schema
export const appointmentFiltersSchema = z.object({
  status: appointmentStatusSchema.optional(),
  buyer_id: z.string().uuid().optional(),
  seller_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
});

// Export types
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CreateOrderData = z.infer<typeof createOrderSchema>;
export type UpdateOrderData = z.infer<typeof updateOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type AddToCartData = z.infer<typeof addToCartSchema>;
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>;
export type Wishlist = z.infer<typeof wishlistSchema>;
export type AddToWishlistData = z.infer<typeof addToWishlistSchema>;
export type OrderFilters = z.infer<typeof orderFiltersSchema>;
export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>;