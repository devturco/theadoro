import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';

// Temporary local interface for reviews (matching usage in ProductDetail)
interface ProductReview {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  helpfulCount: number;
}
import { supabase } from '@/integrations/supabase/client';
import { productService } from '@/services/product.service';
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
      const { data, error } = await productService.getByIdOrSlug(productId);

      if (error) throw error;
      if (!data) throw new Error('Produto não encontrado');

      setProduct(data);

      // Fetch related products
      if (data.category?.id) {
        fetchRelatedProducts(data.category.id, data.id);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar produto';
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
      const { data, error } = await productService.getRelatedProducts(excludeProductId, 4);

      if (error) throw error;
      setRelatedProducts(data || []);

    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!product?.id) return;

    setReviewsLoading(true);

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_buyer_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedReviews: ProductReview[] = (data || []).map(review => ({
        id: review.id,
        user: {
          name: review.profiles?.full_name || 'Usuário',
          avatar: review.profiles?.avatar_url,
        },
        rating: review.rating,
        comment: review.comment || '',
        createdAt: review.created_at,
        helpfulCount: 0,
      }));

      setReviews(transformedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [product]);

  const addReview = useCallback(async (rating: number, comment: string, images?: string[]) => {
    if (!product?.id || !product?.seller?.id) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o vendedor para avaliar.",
        variant: "destructive",
      });
      return;
    }

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
        .from('reviews')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller.id,
          rating,
          comment,
          // images: images || [], // images column does not exist in reviews table type
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
  }, [product, fetchReviews, fetchProduct]);

  const markReviewHelpful = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase.rpc('increment_review_helpful', {
        review_id: reviewId
      });

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, helpfulCount: review.helpfulCount + 1 }
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