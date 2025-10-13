import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters, ProductsResponse } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseProductsOptions {
  initialFilters?: ProductFilters;
  autoFetch?: boolean;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { initialFilters = {}, autoFetch = true } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setLoading(true);
    setError(null);

    try {
      const currentFilters = newFilters || filters;
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
      if (currentFilters.category) {
        query = query.eq('category_id', currentFilters.category);
      }

      if (currentFilters.minPrice !== undefined) {
        query = query.gte('price', currentFilters.minPrice);
      }

      if (currentFilters.maxPrice !== undefined) {
        query = query.lte('price', currentFilters.maxPrice);
      }

      if (currentFilters.rating !== undefined) {
        query = query.gte('rating', currentFilters.rating);
      }

      if (currentFilters.inStock !== undefined) {
        query = query.eq('in_stock', currentFilters.inStock);
      }

      if (currentFilters.isService !== undefined) {
        query = query.eq('is_service', currentFilters.isService);
      }

      if (currentFilters.seller) {
        query = query.eq('seller_id', currentFilters.seller);
      }

      if (currentFilters.tags && currentFilters.tags.length > 0) {
        query = query.overlaps('tags', currentFilters.tags);
      }

      // Apply sorting
      switch (currentFilters.sortBy) {
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
      const page = currentFilters.page || 1;
      const limit = currentFilters.limit || 12;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match Product interface
      const transformedProducts: Product[] = (data || []).map(item => ({
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

      setProducts(transformedProducts);

      // Update pagination
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      setPagination({
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchProducts(updatedFilters);
  }, [filters, fetchProducts]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      const newFilters = { ...filters, page: pagination.page + 1 };
      setFilters(newFilters);
      fetchProducts(newFilters);
    }
  }, [filters, pagination.hasNextPage, pagination.page, fetchProducts]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      const newFilters = { ...filters, page: pagination.page - 1 };
      setFilters(newFilters);
      fetchProducts(newFilters);
    }
  }, [filters, pagination.hasPrevPage, pagination.page, fetchProducts]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      const newFilters = { ...filters, page };
      setFilters(newFilters);
      fetchProducts(newFilters);
    }
  }, [filters, pagination.totalPages, fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    products,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    refetch,
    fetchProducts,
  };
};