import { z } from 'zod';
import { userRoleSchema } from './auth.schemas';

// User Schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').nullable(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').nullable(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').nullable(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').nullable(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').nullable(),
  address: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').nullable(),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX').nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z.array(userRoleSchema).optional(),
  is_approved: z.boolean().optional(),
  last_login: z.string().optional(),
});

// User Stats Schema
export const userStatsSchema = z.object({
  total_users: z.number().int().min(0),
  active_users: z.number().int().min(0),
  pending_sellers: z.number().int().min(0),
  total_buyers: z.number().int().min(0),
  total_sellers: z.number().int().min(0),
  total_admins: z.number().int().min(0),
  new_users_this_month: z.number().int().min(0),
  user_growth_rate: z.number(),
});

// User Filters Schema
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  is_approved: z.boolean().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  created_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  created_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  last_login_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  last_login_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
});

// Create User Schema
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').optional(),
  role: userRoleSchema,
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  address: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').optional(),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX').optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
});

// Update User Schema
export const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').optional(),
  avatar_url: z.string().url('URL do avatar inválida').optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  address: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').optional(),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX').optional(),
  is_approved: z.boolean().optional(),
});

// User Activity Schema
export const userActivitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.string().min(1, 'Ação é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
  created_at: z.string(),
});

// Create User Activity Schema
export const createUserActivitySchema = z.object({
  user_id: z.string().uuid('ID do usuário inválido'),
  action: z.string().min(1, 'Ação é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  ip_address: z.string().ip('Endereço IP inválido').optional(),
  user_agent: z.string().optional(),
});

// User Session Schema
export const userSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_token: z.string().min(1, 'Token da sessão é obrigatório'),
  ip_address: z.string().ip('Endereço IP inválido'),
  user_agent: z.string().min(1, 'User agent é obrigatório'),
  created_at: z.string(),
  expires_at: z.string(),
  is_active: z.boolean(),
});

// Approve User Schema
export const approveUserSchema = z.object({
  user_id: z.string().uuid('ID do usuário inválido'),
  approved: z.boolean(),
  reason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
});

// Bulk User Action Schema
export const bulkUserActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'activate', 'deactivate', 'delete']),
  user_ids: z.array(z.string().uuid()).min(1, 'Pelo menos um usuário deve ser selecionado'),
  reason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
});

// Export types
export type User = z.infer<typeof userSchema>;
export type UserStats = z.infer<typeof userStatsSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type UserActivity = z.infer<typeof userActivitySchema>;
export type CreateUserActivityData = z.infer<typeof createUserActivitySchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
export type ApproveUserData = z.infer<typeof approveUserSchema>;
export type BulkUserActionData = z.infer<typeof bulkUserActionSchema>;