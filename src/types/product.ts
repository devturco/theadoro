export type ProductType = 'physical' | 'service';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  category_id: string | null;
  seller_id: string;
  is_active: boolean;
  product_type: ProductType;
  stock_quantity: number | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  seller?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  };
  reviews?: Review[];
  average_rating?: number;
  review_count?: number;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string;
  product_type: ProductType;
  stock_quantity?: number;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  seller_id?: string;
  is_active?: boolean;
  product_type?: ProductType;
  price_min?: number;
  price_max?: number;
  featured?: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ServiceAvailability {
  id: string;
  product_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}