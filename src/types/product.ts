export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Seller {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  specialties: string[];
  responseTime: string;
  joinedAt: string;
  description: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock_quantity: number;
  tags: string[];
  is_service: boolean;
  created_at: string;
  updated_at: string;
  category: Category;
  seller: Seller;
  reviews?: ProductReview[];
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
  shipping?: ShippingInfo;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  sku?: string;
}

export interface ShippingInfo {
  free_shipping: boolean;
  shipping_cost?: number;
  estimated_delivery: string;
  available_methods: string[];
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  isService?: boolean;
  tags?: string[];
  seller?: string;
  location?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface ProductSearchParams {
  query?: string;
  filters?: ProductFilters;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  itemCount: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}