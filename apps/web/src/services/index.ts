// Base service
export { BaseService } from './base.service';
export type { BaseEntity, PaginationOptions, FilterOptions } from './base.service';

// User service
export { userService } from './user.service';
export type { UserProfile, UserStats } from '@/types/auth';

// Product service
export { productService } from './product.service';
export type { Product, ProductStats, ProductFilters } from './product.service';

// Category service
export { categoryService } from './category.service';
export type { Category, CategoryStats } from './category.service';

// Order service
export { orderService } from './order.service';
export type { Order, OrderItem, OrderStats, OrderFilters, OrderStatus } from '@/types/order';

// Storage service
export { storageService } from './storage.service';
export type { UploadOptions, UploadResult, DeleteResult } from './storage.service';

// Payment service
export { paymentService } from './payment.service';
export type { PaymentIntent, PaymentMethod as PaymentMethodType } from './payment.service';

// Service instances for easy access
export const services = {
  user: userService,
  product: productService,
  category: categoryService,
  order: orderService,
  storage: storageService,
  payment: paymentService
} as const;

// Real-time subscription helpers
export { RealtimeManager } from './index'; // Wait, RealtimeManager was defined in index.ts itself.

/**
 * RealtimeManager is defined here to avoid circular dependencies
 * and provide a central place for subscription management.
 */
import { BaseService as BaseServiceClass } from './base.service';

export class RealtimeManager {
  private static subscriptions = new Map<string, any>();

  static subscribe(
    key: string,
    service: BaseServiceClass<any>,
    callback: (payload: any) => void,
    filter?: string
  ) {
    // Unsubscribe existing if any
    this.unsubscribe(key);

    // Create new subscription
    const channel = service.subscribeToChanges(callback, filter);
    this.subscriptions.set(key, { service, channel });

    return channel;
  }

  static unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.service.unsubscribeFromChanges();
      this.subscriptions.delete(key);
    }
  }

  static unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.service.unsubscribeFromChanges();
    });
    this.subscriptions.clear();
  }

  static getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Utility functions for common operations
export { serviceUtils, handleServiceError, ServiceError, ServiceCache } from './index';

import { PostgrestError } from '@supabase/supabase-js';

export const serviceUtils = {
  formatCurrency: (amount: number, currency: string = 'BRL'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency
    }).format(amount);
  },

  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(dateObj);
  },

  formatRelativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
    return serviceUtils.formatDate(dateObj);
  },

  generatePaginationInfo: (currentPage: number, totalItems: number, itemsPerPage: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startItem: (currentPage - 1) * itemsPerPage + 1,
      endItem: Math.min(currentPage * itemsPerPage, totalItems),
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  },

  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  isValidEmail: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  isValidPhone: (phone: string): boolean => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone),

  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    if (cleaned.length === 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return phone;
  },

  generateId: (): string => Math.random().toString(36).substring(2) + Date.now().toString(36),

  calculatePercentageChange: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileExtension: (filename: string): string => filename.split('.').pop()?.toLowerCase() || '',

  isImageFile: (filename: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return imageExtensions.includes(serviceUtils.getFileExtension(filename));
  }
};

export class ServiceError extends Error {
  constructor(message: string, public code?: string, public statusCode?: number, public details?: any) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const handleServiceError = (error: any): ServiceError => {
  if (error instanceof ServiceError) return error;
  if (error?.message) return new ServiceError(error.message, error.code, error.statusCode, error);
  return new ServiceError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, error);
};

export class ServiceCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  static set(key: string, data: any, ttlInSeconds: number = 300): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlInSeconds * 1000 });
  }
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }
  static delete(key: string): void { this.cache.delete(key); }
  static clear(): void { this.cache.clear(); }
  static has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
  static size(): number { return this.cache.size; }
}