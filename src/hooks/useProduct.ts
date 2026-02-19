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
          slug,
          categories:categories!fk_products_categories (
            id,
            name,
            slug,
            description,
            image_url
          ),
          profiles:profiles!fk_products_profiles (
            id,
            full_name,
            avatar_url,
            location,
            verified,
            seller_delivery_enabled
          )
        `);

      // Check if productId is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);



      if (isUUID) {
        query = query.eq('id', productId);
      } else {
        query = query.eq('slug', productId);
      }

      const { data, error } = await query.single() as { data: any, error: any };

      if (error) throw error;

      if (!data) {
        throw new Error('Produto não encontrado');
      }

      // Fetch sold count
      const { count: soldCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', data.id);

      const sellerInfo = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

      // Transform data to match Product interface
      const transformedProduct: Product = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        original_price: data.original_price,
        images: data.images || [],
        rating: data.rating || 0,
        review_count: data.review_count || 0,
        in_stock: data.in_stock,
        stock_quantity: data.stock_quantity || 0,
        tags: data.tags || [],
        is_active: data.is_active,
        is_service: data.is_service,
        sold_count: soldCount || 0,
        seller_id: sellerInfo?.id || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.categories || {
          id: '',
          name: 'Sem categoria',
          slug: 'sem-categoria',
        },
        seller: {
          id: sellerInfo?.id || '',
          name: sellerInfo?.full_name || 'Vendedor',
          avatar: sellerInfo?.avatar_url,
          location: sellerInfo?.location || '',
          rating: 0,
          reviewCount: 0,
          verified: !!sellerInfo?.verified,
          specialties: [],
          responseTime: '',
          joinedAt: '',
          description: '',
        }
      };

      setProduct(transformedProduct);

      // Fetch related products
      if (data.categories?.id) {
        fetchRelatedProducts(data.categories.id, data.id);
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
            image_url
          ),
          profiles!fk_products_profiles (
            id,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('category_id', categoryId)
        .neq('id', excludeProductId)
        .limit(4);

      if (error) throw error;

      const transformedProducts: Product[] = (data || []).map(item => {
        const sellerInfo = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          original_price: (item as any).original_price,
          images: item.images || [],
          rating: (item as any).rating || 0,
          review_count: (item as any).review_count || 0,
          in_stock: (item as any).in_stock,
          stock_quantity: item.stock_quantity || 0,
          tags: (item as any).tags || [],
          is_active: item.is_active ?? true,
          seller_id: item.seller_id,
          is_service: item.type === 'service',
          created_at: item.created_at,
          updated_at: item.updated_at,
          category: {
            id: item.categories?.id || '',
            name: item.categories?.name || 'Sem categoria',
            slug: item.categories?.slug || 'sem-categoria',
            image: item.categories?.image_url,
          },
          seller: {
            id: sellerInfo?.id || '',
            name: sellerInfo?.full_name || 'Vendedor',
            avatar: sellerInfo?.avatar_url,
            location: '',
            rating: 0,
            reviewCount: 0,
            verified: !!sellerInfo?.verified,
            specialties: [],
            responseTime: '',
            joinedAt: '',
            description: '',
          }
        };
      });

      setRelatedProducts(transformedProducts);
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