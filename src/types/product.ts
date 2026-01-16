export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  original_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  stock_quantity: number;
  in_stock: boolean;
  is_active: boolean;
  is_service: boolean;
  tags: string[];
  stock?: number;
  sold_count?: number;
  variants?: any[];
  shipping_info?: any;
  seller_id: string;
  created_at?: string;
  updated_at?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  seller: {
    id: string;
    name: string;
    avatar?: string;
    location?: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    specialties?: string[];
    responseTime?: string;
    joinedAt?: string;
    description?: string;
  };
  isWishlisted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string; // UI prop
  image_url?: string; // DB prop
  productCount: number;
  product_count?: number; // DB prop maybe
  is_active?: boolean; // DB prop
  parentId?: string;
  subcategories?: Category[];
  parent?: Category;
  created_at?: string;
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

export type ProductType = 'physical' | 'service';