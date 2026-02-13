import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Seller {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  location: string;
  verified: boolean;
  specialties: string[];
  responseTime: string;
  joinedAt: string;
  productCount?: number;
  mainCategory?: string;
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  businessHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  policies?: {
    returns?: string;
    shipping?: string;
    customization?: string;
  };
  subscriptionPlan?: string;
}

export interface SellerFilters {
  location?: string;
  specialty?: string;
  verified?: boolean;
  minRating?: number;
  sortBy?: 'rating' | 'name' | 'joinedAt' | 'productCount';
  sortOrder?: 'asc' | 'desc';
}

export interface UseSellersReturn {
  sellers: Seller[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  filters: SellerFilters;
  setFilters: (filters: SellerFilters) => void;
}

export interface UseSellerReturn {
  seller: Seller | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const ITEMS_PER_PAGE = 12;

export const useSellers = (initialFilters: SellerFilters = {}): UseSellersReturn => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SellerFilters>(initialFilters);

  const loadSellers = async (page: number = 1, currentFilters: SellerFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = (supabase.from as any)('seller_summary')
        .select('*', { count: 'exact' });

      // Apply filters
      if (currentFilters.location) {
        query = query.ilike('location', `%${currentFilters.location}%`);
      }

      if (currentFilters.verified !== undefined) {
        // Assume all sellers in seller_summary are 'verified' for now as they are active sellers
        // This can be refined if we add a 'verified' column to profiles
      }

      if (currentFilters.minRating) {
        query = query.gte('rating', currentFilters.minRating);
      }

      // Apply sorting
      if (currentFilters.sortBy) {
        const order = currentFilters.sortOrder === 'desc' ? { ascending: false } : { ascending: true };

        switch (currentFilters.sortBy) {
          case 'rating':
            query = query.order('rating', order);
            break;
          case 'name':
            query = query.order('name', order);
            break;
          case 'joinedAt':
            query = query.order('joined_at', order);
            break;
          case 'productCount':
            query = query.order('product_count', order);
            break;
        }
      } else {
        query = query.order('rating', { ascending: false }); // Default sort
      }

      const { data, error: fetchError, count } = await query.range(from, to);

      if (fetchError) throw fetchError;

      const mappedSellers: Seller[] = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        avatar: s.avatar,
        coverImage: s.banner,
        rating: Number(s.rating || 0),
        reviewCount: Number(s.review_count || 0),
        location: s.location || 'Brasil',
        verified: !!s.is_seller,
        specialties: [], // This would need another join or a new column
        responseTime: '2h', // Default
        joinedAt: s.joined_at,
        productCount: Number(s.product_count || 0),
        mainCategory: s.main_category
      }));

      setTotalCount(count || 0);

      if (page === 1) {
        setSellers(mappedSellers);
      } else {
        setSellers(prev => [...prev, ...mappedSellers]);
      }

      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading sellers:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadSellers(currentPage + 1);
    }
  };

  const refresh = () => {
    setCurrentPage(1);
    loadSellers(1);
  };

  const updateFilters = (newFilters: SellerFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadSellers(1, newFilters);
  };

  const hasMore = sellers.length < totalCount;

  useEffect(() => {
    loadSellers();
  }, []);

  return {
    sellers,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refresh,
    filters,
    setFilters: updateFilters,
  };
};

export const useSeller = (sellerId: string): UseSellerReturn => {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeller = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase.from as any)('seller_summary')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const s = data as any;

        // Fetch active subscription
        let subscriptionPlan = undefined;
        const { data: subData } = await (supabase.from as any)('seller_subscriptions')
          .select('plan:plan_id(name)')
          .eq('seller_id', sellerId)
          .eq('status', 'active')
          .single();

        if (subData && subData.plan) {
          subscriptionPlan = (subData.plan as any).name;
        }

        setSeller({
          id: s.id,
          name: s.name,
          description: s.description || '',
          avatar: s.avatar,
          coverImage: s.banner,
          rating: Number(s.rating || 0),
          reviewCount: Number(s.review_count || 0),
          location: s.location || 'Brasil',
          verified: !!s.is_seller,
          specialties: [],
          responseTime: '2h',
          joinedAt: s.joined_at,
          productCount: Number(s.product_count || 0),
          mainCategory: s.main_category,
          subscriptionPlan
        });
      } else {
        setError('Vendedor não encontrado');
      }
    } catch (err) {
      console.error('Error loading seller:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadSeller();
  };

  useEffect(() => {
    if (sellerId) {
      loadSeller();
    }
  }, [sellerId]);

  return {
    seller,
    loading,
    error,
    refresh,
  };
};