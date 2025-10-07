import { z } from 'zod';

// User Role Schema
export const userRoleSchema = z.enum(['admin', 'seller', 'buyer']);

// Auth User Schema
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  user_metadata: z.object({
    full_name: z.string().optional(),
    avatar_url: z.string().url().optional(),
  }),
});

// User Profile Schema
export const userProfileSchema = z.object({
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
});

// User Role Record Schema
export const userRoleRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: userRoleSchema,
  created_at: z.string(),
});

// Sign Up Schema
export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').optional(),
  role: userRoleSchema.default('buyer'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Sign In Schema
export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Update Password Schema
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').nullable(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').nullable(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').nullable(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').nullable(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').nullable(),
  address: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').nullable(),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX').nullable(),
});

// Export types
export type UserRole = z.infer<typeof userRoleSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserRoleRecord = z.infer<typeof userRoleRecordSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;