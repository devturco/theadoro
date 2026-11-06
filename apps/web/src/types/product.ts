import { Products, ProductVariations, Categories, Profiles } from '@theadoro/api-client';

export interface ProductVariation extends Partial<ProductVariations> {
  id: string;
  product_id: string;
  stock_quantity: number;
}

export interface Product extends Products {
  // UI and Relation Extensions
  in_stock: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
  };
  seller: {
    id: string;
    name?: string;
    full_name?: string;
    avatar?: string;
    avatar_url?: string;
    location?: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    seller_delivery_enabled?: boolean;
  };
  
  // Computed/Virtual fields
  isWishlisted?: boolean;
  variations?: ProductVariation[];
}

export interface Category extends Categories {
  productCount?: number;
  subcategories?: Category[];
  parent?: Category;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  isService?: boolean;
  tags?: string[];
  search?: string;
  sellerId?: string;
  sortBy?: string;
  seller?: string;
  page?: number;
  limit?: number;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  out_of_stock: number;
  low_stock: number;
  featured_products: number;
  average_price: number;
  total_value: number;
}

export type ProductType = 'physical' | 'service' | 'digital';