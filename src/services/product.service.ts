import { BaseService, BaseEntity } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category_id: string;
  seller_id: string;
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  stock_quantity: number;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  featured: boolean;
  discount_percentage?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  rating_average?: number;
  rating_count?: number;
  views_count?: number;
  sales_count?: number;
  // Relations
  category?: {
    id: string;
    name: string;
  };
  seller?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
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

export interface ProductFilters {
  category_id?: string;
  seller_id?: string;
  status?: Product['status'];
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  search?: string;
}

class ProductService extends BaseService<Product> {
  constructor() {
    super('products');
  }

  /**
   * Get products with relations (category and seller info)
   */
  async getProductsWithRelations(
    filters: ProductFilters = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: Product[]; count: number; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(id, full_name, avatar_url)
        `, { count: 'exact' });

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }

      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }

      if (filters.in_stock) {
        query = query.gt('stock_quantity', 0);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      return {
        data: data as Product[] || [],
        count: count || 0,
        error
      };
    } catch (error) {
      console.error('Error getting products with relations:', error);
      return {
        data: [],
        count: 0,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{ data: ProductStats | null; error: PostgrestError | null }> {
    try {
      // Get total products
      const { count: totalProducts, error: totalError } = await this.count();
      if (totalError) throw totalError;

      // Get active products
      const { count: activeProducts, error: activeError } = await this.count({ status: 'active' });
      if (activeError) throw activeError;

      // Get out of stock products
      const { count: outOfStock, error: outOfStockError } = await this.count({ status: 'out_of_stock' });
      if (outOfStockError) throw outOfStockError;

      // Get low stock products (stock_quantity <= 10)
      const { data: lowStockData, error: lowStockError } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .lte('stock_quantity', 10)
        .gt('stock_quantity', 0);

      if (lowStockError) throw lowStockError;

      // Get featured products
      const { count: featuredProducts, error: featuredError } = await this.count({ featured: true });
      if (featuredError) throw featuredError;

      // Get price statistics
      const { data: priceStats, error: priceError } = await supabase
        .from(this.tableName)
        .select('price')
        .eq('status', 'active');

      if (priceError) throw priceError;

      const prices = priceStats?.map(p => p.price) || [];
      const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const totalValue = prices.reduce((a, b) => a + b, 0);

      const stats: ProductStats = {
        total_products: totalProducts,
        active_products: activeProducts,
        out_of_stock: outOfStock,
        low_stock: lowStockData?.length || 0,
        featured_products: featuredProducts,
        average_price: Math.round(averagePrice * 100) / 100,
        total_value: totalValue
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting product stats:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Get products by seller
   */
  async getProductsBySeller(sellerId: string): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting products by seller:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('rating_average', { ascending: false })
        .limit(limit);

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting featured products:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting products by category:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Search products
   */
  async searchProducts(
    searchTerm: string,
    filters: ProductFilters = {}
  ): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(id, full_name, avatar_url)
        `);

      // Apply search term
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'min_price') {
            query = query.gte('price', value);
          } else if (key === 'max_price') {
            query = query.lte('price', value);
          } else if (key === 'in_stock' && value) {
            query = query.gt('stock_quantity', 0);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      query = query.order('rating_average', { ascending: false });

      const { data, error } = await query;

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Toggle product status
   */
  async toggleProductStatus(productId: string): Promise<{ data: Product | null; error: PostgrestError | null }> {
    try {
      // First get current status
      const { data: currentProduct, error: fetchError } = await this.getById(productId);
      if (fetchError || !currentProduct) {
        return { data: null, error: fetchError };
      }

      const newStatus = currentProduct.status === 'active' ? 'inactive' : 'active';

      return this.update(productId, { status: newStatus });
    } catch (error) {
      console.error('Error toggling product status:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Toggle featured status
   */
  async toggleFeaturedStatus(productId: string): Promise<{ data: Product | null; error: PostgrestError | null }> {
    try {
      // First get current featured status
      const { data: currentProduct, error: fetchError } = await this.getById(productId);
      if (fetchError || !currentProduct) {
        return { data: null, error: fetchError };
      }

      return this.update(productId, { featured: !currentProduct.featured });
    } catch (error) {
      console.error('Error toggling featured status:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(productId: string, quantity: number): Promise<{ data: Product | null; error: PostgrestError | null }> {
    try {
      const status = quantity <= 0 ? 'out_of_stock' : 'active';

      return this.update(productId, {
        stock_quantity: quantity,
        status
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(productId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase.rpc('increment_product_views', {
        product_id: productId
      });

      return { error };
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return { error: error as PostgrestError };
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(id, full_name)
        `)
        .lte('stock_quantity', threshold)
        .gt('stock_quantity', 0)
        .eq('status', 'active')
        .order('stock_quantity', { ascending: true });

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('sales_count', { ascending: false })
        .limit(limit);

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(
    productIds: string[],
    updateData: Partial<Pick<Product, 'status' | 'featured' | 'category_id'>>
  ): Promise<{ data: Product[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .in('id', productIds)
        .select();

      return {
        data: data as Product[],
        error
      };
    } catch (error) {
      console.error('Error bulk updating products:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, limit: number = 6): Promise<{ data: Product[]; error: PostgrestError | null }> {
    try {
      // First get the current product to find its category
      const { data: currentProduct, error: currentError } = await this.getById(productId);
      if (currentError || !currentProduct) {
        return { data: [], error: currentError };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(id, full_name, avatar_url)
        `)
        .eq('category_id', currentProduct.category_id)
        .neq('id', productId)
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('rating_average', { ascending: false })
        .limit(limit);

      return {
        data: data as Product[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting related products:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get product by ID or Slug
   */
  async getByIdOrSlug(idOrSlug: string): Promise<{ data: Product | null; error: PostgrestError | null }> {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          category:categories(id, name, slug, description, image_url),
          seller:profiles(id, full_name, avatar_url, location, verified, seller_delivery_enabled)
        `)
        .single();

      if (isUUID) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data as Product,
        error: null
      };

    } catch (error) {
      console.error('Error getting product by id/slug:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Create a new product
   * Overrides BaseService create to handle specific logic if needed
   */
  async create(data: Partial<Product>): Promise<{ data: Product | null; error: PostgrestError | null }> {
    // Ensure numeric values
    const sanitizedData = {
      ...data,
      price: Number(data.price),
      stock_quantity: Number(data.stock_quantity),
      // Slug is generated by DB trigger, no need to send unless overriding
    };
    return super.create(sanitizedData);
  }

  async addVariations(variations: any[]): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('product_variations')
        .insert(variations);

      return { error };
    } catch (error) {
      console.error('Error adding variations:', error);
      return { error: error as PostgrestError };
    }
  }

}

export const productService = new ProductService();