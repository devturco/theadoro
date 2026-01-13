import { useState, useEffect, useCallback } from 'react';
import { Product, ProductReview } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useProduct = (productId: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

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
            avatar_url
          )
        `);

      // Check if productId is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

      if (isUUID) {
        query = query.eq('id', productId);
      } else {
        query = query.eq('slug', productId);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      if (!data) {
        throw new Error('Produto não encontrado');
      }

      // Transform data to match Product interface
      const transformedProduct: Product = {
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

      setProduct(transformedProduct);

      // Fetch related products
      if (data.categories?.id) {
        fetchRelatedProducts(data.categories.id, productId);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produto';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchRelatedProducts = useCallback(async (categoryId: string, excludeProductId: string) => {
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
            avatar_url
          )
        `)
        .eq('category_id', categoryId)
        .neq('id', excludeProductId)
        .limit(4);

      if (error) throw error;

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

      setRelatedProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    setReviewsLoading(true);

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedReviews: ProductReview[] = (data || []).map(review => ({
        id: review.id,
        userId: review.user_id,
        userName: review.profiles?.full_name || 'Usuário',
        userAvatar: review.profiles?.avatar_url,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        helpful: review.helpful_count || 0,
        images: review.images || [],
      }));

      setReviews(transformedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  const addReview = useCallback(async (rating: number, comment: string, images?: string[]) => {
    if (!productId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para avaliar um produto.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment,
          images: images || [],
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi enviada com sucesso.",
      });

      // Refresh reviews
      fetchReviews();

      // Refresh product to update rating
      fetchProduct();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar avaliação';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [productId, fetchReviews, fetchProduct]);

  const markReviewHelpful = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase.rpc('increment_review_helpful', {
        review_id: reviewId
      });

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, helpful: review.helpful + 1 }
          : review
      ));

    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  }, []);

  // Fetch product on mount or when productId changes
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Fetch reviews when product is loaded
  useEffect(() => {
    if (product) {
      fetchReviews();
    }
  }, [product, fetchReviews]);

  return {
    product,
    reviews,
    relatedProducts,
    loading,
    reviewsLoading,
    error,
    refetch: fetchProduct,
    addReview,
    markReviewHelpful,
  };
};