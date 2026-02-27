export interface ProductVariation {
  id: string;
  product_id: string;
  sku?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  weight?: number;
  price?: number;
  stock_quantity: number;
}

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
  type: ProductType;
  category_id?: string;
  is_active: boolean;
  is_service: boolean;
  tags: string[];
  stock?: number;
  sold_count?: number;
  variants?: any[]; // Keep for backward compatibility if needed, but prefer variations
  variations?: ProductVariation[];

  seller_id: string;
  created_at?: string;
  updated_at?: string;

  // New fields
  brand?: string;
  model?: string;
  gender?: string;
  video_url?: string;
  warranty_info?: any;
  specifications?: any;
  shipping_info?: {
    weight?: number;
    height?: number;
    width?: number;
    depth?: number;
  };
  shipping_options?: {
    express_delivery?: boolean; // Entrega Expressa (Uber)
    own_delivery?: boolean;     // Entrega Própria
  };

  category: {
    id: string;
    name: string;
    slug: string;
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
  parent_id?: string; // DB prop
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

export type ProductType = 'physical' | 'service' | 'digital';