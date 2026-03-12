import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ProductFilters } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'tag';
  count?: number;
}

interface UseProductSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
}

export const useProductSearch = (options: UseProductSearchOptions = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxSuggestions = 10
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theadoro-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading recent searches:', err);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < minQueryLength) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 10); // Keep only last 10 searches

    setRecentSearches(updated);
    localStorage.setItem('theadoro-recent-searches', JSON.stringify(updated));
  }, [recentSearches, minQueryLength]);

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (searchQuery: string, searchFilters: ProductFilters = {}) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        performSearch(searchQuery, searchFilters);
      }, debounceMs);
    };
  }, [debounceMs]);

  const performSearch = useCallback(async (searchQuery: string, searchFilters: ProductFilters = {}) => {
    if (!searchQuery.trim() || searchQuery.length < minQueryLength) {
      setResults([]);
      setError(null);
      return;
    }

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
            avatar_url,
            location
          )
        `);

      // Text search in name, description, and tags
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);

      // Apply additional filters
      if (searchFilters.category) {
        query = query.eq('category_id', searchFilters.category);
      }

      if (searchFilters.minPrice !== undefined) {
        query = query.gte('price', searchFilters.minPrice);
      }

      if (searchFilters.maxPrice !== undefined) {
        query = query.lte('price', searchFilters.maxPrice);
      }

      if (searchFilters.rating !== undefined) {
        query = query.gte('rating', searchFilters.rating);
      }

      if (searchFilters.inStock !== undefined) {
        query = query.eq('in_stock', searchFilters.inStock);
      }

      if (searchFilters.isService !== undefined) {
        query = query.eq('is_service', searchFilters.isService);
      }

      if (searchFilters.seller) {
        query = query.eq('seller_id', searchFilters.seller);
      }

      // Apply sorting
      switch (searchFilters.sortBy) {
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
          // Default: relevance (products with query in name first)
          query = query.order('name', { ascending: true });
      }

      const { data, error } = await query.limit(50);

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

      setResults(transformedProducts);
      saveRecentSearch(searchQuery);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na busca';
      setError(errorMessage);
      toast({
        title: "Erro na busca",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [minQueryLength, saveRecentSearch]);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);

    try {
      // Get product suggestions
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      // Get category suggestions
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${searchQuery}%`)
        .limit(3);

      const productSuggestions: SearchSuggestion[] = (products || []).map(p => ({
        id: p.id,
        text: p.name,
        type: 'product' as const,
      }));

      const categorySuggestions: SearchSuggestion[] = (categories || []).map(c => ({
        id: c.id,
        text: c.name,
        type: 'category' as const,
      }));

      const allSuggestions = [
        ...productSuggestions,
        ...categorySuggestions,
      ].slice(0, maxSuggestions);

      setSuggestions(allSuggestions);

    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [minQueryLength, maxSuggestions]);

  const search = useCallback((searchQuery: string, searchFilters: ProductFilters = {}) => {
    setQuery(searchQuery);
    setFilters(searchFilters);
    debouncedSearch(searchQuery, searchFilters);
  }, [debouncedSearch]);

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (query) {
      performSearch(query, updatedFilters);
    }
  }, [filters, query, performSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setSuggestions([]);
    setFilters({});
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('theadoro-recent-searches');
  }, []);

  // Auto-fetch suggestions when query changes
  useEffect(() => {
    if (query.length >= minQueryLength) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(query);
      }, 150); // Shorter debounce for suggestions

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [query, minQueryLength, fetchSuggestions]);

  return {
    query,
    results,
    suggestions,
    loading,
    suggestionsLoading,
    error,
    filters,
    recentSearches,
    search,
    updateFilters,
    clearSearch,
    clearRecentSearches,
    fetchSuggestions,
  };
};