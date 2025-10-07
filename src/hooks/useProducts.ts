import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCRUD } from './useCRUD';
import type { Product, CreateProductData, ProductFilters } from '@/types/product';

export const useProducts = (filters?: ProductFilters) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const {
    data: products,
    loading,
    error,
    pagination,
    create,
    update,
    remove,
    getById,
    refresh,
    changePage,
    search
  } = useCRUD<Product>({
    table: 'products',
    select: `
      *,
      category:categories(id, name),
      seller:profiles!seller_id(id, full_name, avatar_url)
    `,
    orderBy: { column: 'created_at', ascending: false },
    filters: filters || {},
    realtime: true,
    pageSize: 12
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Create product with image upload
  const createProduct = useCallback(async (productData: CreateProductData): Promise<Product> => {
    try {
      const { images, ...data } = productData;
      
      // Create product first
      const product = await create(data as any);

      // If there are images, we would handle them here
      // For now, we'll just return the product
      return product;
    } catch (error) {
      throw error;
    }
  }, [create]);

  // Update product status (activate/deactivate)
  const toggleProductStatus = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    try {
      await update(id, { is_active: isActive } as any);
      toast.success(`Produto ${isActive ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      throw error;
    }
  }, [update]);

  // Get products by seller
  const getProductsBySeller = useCallback(async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching seller products:', err);
      toast.error('Erro ao carregar produtos do vendedor');
      return [];
    }
  }, []);

  // Get featured products
  const getFeaturedProducts = useCallback(async (limit = 8) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          seller:profiles!seller_id(id, full_name, avatar_url)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching featured products:', err);
      return [];
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string, filters: ProductFilters = {}) => {
    const searchFilters = {
      ...filters,
      name: `%${query}%`
    };

    search(searchFilters);
  }, [search]);

  // Filter products by category
  const filterByCategory = useCallback((categoryId: string) => {
    search({ category_id: categoryId });
  }, [search]);

  // Filter products by price range
  const filterByPriceRange = useCallback((minPrice: number, maxPrice: number) => {
    search({ 
      price: `gte.${minPrice}`,
      price_max: `lte.${maxPrice}`
    });
  }, [search]);

  return {
    products,
    loading,
    error,
    pagination,
    categories,
    loadingCategories,
    createProduct,
    updateProduct: update,
    deleteProduct: remove,
    getProduct: getById,
    toggleProductStatus,
    getProductsBySeller,
    getFeaturedProducts,
    searchProducts,
    filterByCategory,
    filterByPriceRange,
    fetchCategories,
    refresh,
    changePage
  };
};