import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters } from '@/types/product'; // Ensure this type matches or adapt
import { productService } from '@/services/product.service'; // Start using the service
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
      const page = currentFilters.page || 1;
      const limit = currentFilters.limit || 12;

      // Map frontend filters to service filters
      const serviceFilters = {
        category_id: currentFilters.category,
        seller_id: currentFilters.seller,
        min_price: currentFilters.minPrice,
        max_price: currentFilters.maxPrice,
        in_stock: currentFilters.inStock,
        search: currentFilters.search,
        status: undefined, // active? depends on context. Admin sees all? 
        // For now let's assume listing shows active products unless specified
      };

      // Call Unified Service
      const { data, count, error } = await productService.getProductsWithRelations(
        serviceFilters,
        { page, limit }
      );

      if (error) throw error;

      setProducts(data || []);

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

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar produtos';
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

  // Auto-fetch
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  // Mutations using Service
  const createProduct = useCallback(async (productData: any) => {
    const { data, error } = await productService.create(productData);
    if (error) throw error;
    return data;
  }, []);

  const updateProduct = useCallback(async (id: string, productData: any) => {
    const { data, error } = await productService.update(id, productData);
    if (error) throw error;
    return data;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await productService.delete(id);
    if (error) throw error;
  }, []);

  const toggleProductStatus = useCallback(async (id: string) => {
    const { data, error } = await productService.toggleProductStatus(id);
    if (error) throw error;
    return data;
  }, []);

  return {
    products,
    loading,
    error,
    filters,
    pagination,
    totalCount: pagination.total,
    totalPages: pagination.totalPages,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    refetch,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus
  };
};