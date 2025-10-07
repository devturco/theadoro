// Base service
export { BaseService } from './base.service';
export type { BaseEntity, PaginationOptions, FilterOptions } from './base.service';

// User service
export { userService } from './user.service';
export type { User, UserStats } from './user.service';

// Product service
export { productService } from './product.service';
export type { Product, ProductStats, ProductFilters } from './product.service';

// Category service
export { categoryService } from './category.service';
export type { Category, CategoryStats } from './category.service';

// Order service
export { orderService } from './order.service';
export type { Order, OrderItem, OrderStats, OrderFilters } from './order.service';

// Storage service
export { storageService } from './storage.service';
export type { UploadOptions, UploadResult, DeleteResult } from './storage.service';

// Service instances for easy access
export const services = {
  user: userService,
  product: productService,
  category: categoryService,
  order: orderService,
  storage: storageService
} as const;

// Real-time subscription helpers
export class RealtimeManager {
  private static subscriptions = new Map<string, any>();

  static subscribe(
    key: string,
    service: BaseService<any>,
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
export const serviceUtils = {
  /**
   * Format currency values
   */
  formatCurrency: (amount: number, currency: string = 'BRL'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency
    }).format(amount);
  },

  /**
   * Format date values
   */
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(dateObj);
  },

  /**
   * Format relative time
   */
  formatRelativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Agora mesmo';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else {
      return serviceUtils.formatDate(dateObj);
    }
  },

  /**
   * Generate pagination info
   */
  generatePaginationInfo: (
    currentPage: number,
    totalItems: number,
    itemsPerPage: number
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  },

  /**
   * Debounce function for search
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone format (Brazilian)
   */
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Format phone number
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },

  /**
   * Generate random ID
   */
  generateId: (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  /**
   * Calculate percentage change
   */
  calculatePercentageChange: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  /**
   * Truncate text
   */
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Convert file size to human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file extension from filename
   */
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  /**
   * Check if file is image
   */
  isImageFile: (filename: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const extension = serviceUtils.getFileExtension(filename);
    return imageExtensions.includes(extension);
  }
};

// Error handling utilities
export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const handleServiceError = (error: any): ServiceError => {
  if (error instanceof ServiceError) {
    return error;
  }

  if (error?.message) {
    return new ServiceError(error.message, error.code, error.statusCode, error);
  }

  return new ServiceError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, error);
};

// Cache utilities for better performance
export class ServiceCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttlInSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlInSeconds * 1000
    });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static delete(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  static size(): number {
    return this.cache.size;
  }
}