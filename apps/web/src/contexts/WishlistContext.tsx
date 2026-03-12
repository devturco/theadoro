import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
  loading: boolean;
  toggleWishlist: (product: Product) => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load wishlist from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      // Load from localStorage for non-authenticated users
      loadLocalWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          product_id,
          products (
            id,
            name,
            slug,
            description,
            price,
            original_price,
            images,
            rating,
            review_count,
            in_stock,
            stock_quantity,
            tags,
            is_service,
            created_at,
            updated_at,
            categories (
              id,
              name,
              slug,
              description,
              image_url
            ),
            profiles (
              id,
              full_name,
              avatar_url,
              city,
              state
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const products = data
        ?.filter(item => item.products)
        .map(item => ({
          ...item.products,
          category: {
            ...item.products.categories,
            image: item.products.categories?.image_url
          },
          seller: {
            id: item.products.profiles?.id || '',
            name: item.products.profiles?.full_name || 'Vendedor',
            avatar: item.products.profiles?.avatar_url,
            location: item.products.profiles?.city ? `${item.products.profiles.city}, ${item.products.profiles.state}` : '',
            rating: 0,
            reviewCount: 0,
            verified: false,
            specialties: [],
            responseTime: '',
            joinedAt: '',
            description: '',
          }
        })) || [];

      setWishlist(products);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar sua lista de favoritos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocalWishlist = () => {
    try {
      const savedWishlist = localStorage.getItem('theadoro-wishlist');
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlist(parsedWishlist);
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
    }
  };

  const saveLocalWishlist = (newWishlist: Product[]) => {
    localStorage.setItem('theadoro-wishlist', JSON.stringify(newWishlist));
  };

  const addToWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) return;

    const newWishlist = [...wishlist, product];
    setWishlist(newWishlist);

    if (user) {
      try {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) throw error;

        toast({
          title: "Adicionado aos favoritos!",
          description: `${product.name} foi adicionado à sua lista de favoritos.`,
        });
      } catch (error) {
        // Rollback on error
        setWishlist(wishlist);
        console.error('Error adding to wishlist:', error);
        toast({
          title: "Erro",
          description: "Não foi possível adicionar aos favoritos.",
          variant: "destructive",
        });
      }
    } else {
      saveLocalWishlist(newWishlist);
      toast({
        title: "Adicionado aos favoritos!",
        description: `${product.name} foi adicionado à sua lista de favoritos.`,
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const product = wishlist.find(p => p.id === productId);
    const newWishlist = wishlist.filter(p => p.id !== productId);
    setWishlist(newWishlist);

    if (user) {
      try {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        toast({
          title: "Removido dos favoritos",
          description: `${product?.name || 'Produto'} foi removido da sua lista de favoritos.`,
        });
      } catch (error) {
        // Rollback on error
        setWishlist(wishlist);
        console.error('Error removing from wishlist:', error);
        toast({
          title: "Erro",
          description: "Não foi possível remover dos favoritos.",
          variant: "destructive",
        });
      }
    } else {
      saveLocalWishlist(newWishlist);
      toast({
        title: "Removido dos favoritos",
        description: `${product?.name || 'Produto'} foi removido da sua lista de favoritos.`,
      });
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(product => product.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const wishlistCount = wishlist.length;

  const value: WishlistContextType = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistCount,
    loading,
    toggleWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};