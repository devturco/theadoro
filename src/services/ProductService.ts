import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFilters, ProductsResponse, Category } from '@/types/product';

export class ProductService {
  static async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            image
          ),
          profiles (
            id,
            full_name,
            avatar_url,
            location
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.rating !== undefined) {
        query = query.gte('rating', filters.rating);
      }

      if (filters.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock);
      }

      if (filters.isService !== undefined) {
        query = query.eq('is_service', filters.isService);
      }

      if (filters.seller) {
        query = query.eq('seller_id', filters.seller);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.location) {
        // Filter by seller location through join
        query = query.eq('profiles.location', filters.location);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('review_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match Product interface
      const products: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        images: item.images || [],
        rating: item.rating || 0,
        review_count: item.review_count || 0,
        in_stock: item.in_stock,
        stock_quantity: item.stock_quantity || 0,
        tags: item.tags || [],
        is_service: item.is_service,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.categories || {
          id: '',
          name: 'Sem categoria',
          slug: 'sem-categoria',
        },
        seller: {
          id: item.profiles?.id || '',
          name: item.profiles?.full_name || 'Vendedor',
          avatar: item.profiles?.avatar_url,
          location: item.profiles?.location || '',
          rating: 0,
          reviewCount: 0,
          verified: false,
          specialties: [],
          responseTime: '',
          joinedAt: '',
          description: '',
        }
      }));

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            image
          ),
          profiles (
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        original_price: data.original_price,
        images: data.images || [],
        rating: data.rating || 0,
        review_count: data.review_count || 0,
        in_stock: data.in_stock,
        stock_quantity: data.stock_quantity || 0,
        tags: data.tags || [],
        is_service: data.is_service,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.categories || {
          id: '',
          name: 'Sem categoria',
          slug: 'sem-categoria',
        },
        seller: {
          id: data.profiles?.id || '',
          name: data.profiles?.full_name || 'Vendedor',
          avatar: data.profiles?.avatar_url,
          location: data.profiles?.location || '',
          rating: 0,
          reviewCount: 0,
          verified: false,
          specialties: [],
          responseTime: '',
          joinedAt: '',
          description: '',
        }
      };

    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  static async getProductsByCategory(categorySlug: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    try {
      // First get the category by slug
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (categoryError) throw categoryError;

      if (!category) {
        throw new Error('Categoria não encontrada');
      }

      // Then get products for this category
      return this.getProducts({
        ...filters,
        category: category.id,
      });

    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  static async getProductsBySeller(sellerId: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    try {
      return this.getProducts({
        ...filters,
        seller: sellerId,
      });

    } catch (error) {
      console.error('Error fetching products by seller:', error);
      throw error;
    }
  }

  static async searchProducts(query: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    try {
      let supabaseQuery = supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            image
          ),
          profiles (
            id,
            full_name,
            avatar_url,
            location
          )
        `, { count: 'exact' });

      // Text search in name, description, and tags
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

      // Apply additional filters
      if (filters.category) {
        supabaseQuery = supabaseQuery.eq('category_id', filters.category);
      }

      if (filters.minPrice !== undefined) {
        supabaseQuery = supabaseQuery.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        supabaseQuery = supabaseQuery.lte('price', filters.maxPrice);
      }

      if (filters.rating !== undefined) {
        supabaseQuery = supabaseQuery.gte('rating', filters.rating);
      }

      if (filters.inStock !== undefined) {
        supabaseQuery = supabaseQuery.eq('in_stock', filters.inStock);
      }

      if (filters.isService !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_service', filters.isService);
      }

      if (filters.seller) {
        supabaseQuery = supabaseQuery.eq('seller_id', filters.seller);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          supabaseQuery = supabaseQuery.order('price', { ascending: true });
          break;
        case 'price_desc':
          supabaseQuery = supabaseQuery.order('price', { ascending: false });
          break;
        case 'rating':
          supabaseQuery = supabaseQuery.order('rating', { ascending: false });
          break;
        case 'newest':
          supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
          break;
        case 'popular':
          supabaseQuery = supabaseQuery.order('review_count', { ascending: false });
          break;
        default:
          // Default: relevance (products with query in name first)
          supabaseQuery = supabaseQuery.order('name', { ascending: true });
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      supabaseQuery = supabaseQuery.range(from, to);

      const { data, error, count } = await supabaseQuery;

      if (error) throw error;

      // Transform data to match Product interface
      const products: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        images: item.images || [],
        rating: item.rating || 0,
        review_count: item.review_count || 0,
        in_stock: item.in_stock,
        stock_quantity: item.stock_quantity || 0,
        tags: item.tags || [],
        is_service: item.is_service,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.categories || {
          id: '',
          name: 'Sem categoria',
          slug: 'sem-categoria',
        },
        seller: {
          id: item.profiles?.id || '',
          name: item.profiles?.full_name || 'Vendedor',
          avatar: item.profiles?.avatar_url,
          location: item.profiles?.location || '',
          rating: 0,
          reviewCount: 0,
          verified: false,
          specialties: [],
          responseTime: '',
          joinedAt: '',
          description: '',
        }
      }));

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  static async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            image
          ),
          profiles (
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .eq('featured', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        images: item.images || [],
        rating: item.rating || 0,
        review_count: item.review_count || 0,
        in_stock: item.in_stock,
        stock_quantity: item.stock_quantity || 0,
        tags: item.tags || [],
        is_service: item.is_service,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.categories || {
          id: '',
          name: 'Sem categoria',
          slug: 'sem-categoria',
        },
        seller: {
          id: item.profiles?.id || '',
          name: item.profiles?.full_name || 'Vendedor',
          avatar: item.profiles?.avatar_url,
          location: item.profiles?.location || '',
          rating: 0,
          reviewCount: 0,
          verified: false,
          specialties: [],
          responseTime: '',
          joinedAt: '',
          description: '',
        }
      }));

    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  static async getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            image
          ),
          profiles (
            id,
            full_name,
            avatar_url,
            location
          )
        `)
        .eq('category_id', categoryId)
        .neq('id', productId)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        images: item.images || [],
        rating: item.rating || 0,
        review_count: item.review_count || 0,
        in_stock: item.in_stock,
        stock_quantity: item.stock_quantity || 0,
        tags: item.tags || [],
        is_service: item.is_service,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.categories || {
          id: '',
          name: 'Sem categoria',
          slug: 'sem-categoria',
        },
        seller: {
          id: item.profiles?.id || '',
          name: item.profiles?.full_name || 'Vendedor',
          avatar: item.profiles?.avatar_url,
          location: item.profiles?.location || '',
          rating: 0,
          reviewCount: 0,
          verified: false,
          specialties: [],
          responseTime: '',
          joinedAt: '',
          description: '',
        }
      }));

    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  }
}