import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PaginationParams, ApiResponse, CRUDOperations } from '@/types/common';

interface UseCRUDOptions {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Record<string, any>;
  realtime?: boolean;
  pageSize?: number;
}

export const useCRUD = <T extends { id: string }>({
  table,
  select = '*',
  orderBy = { column: 'created_at', ascending: false },
  filters = {},
  realtime = false,
  pageSize = 10
}: UseCRUDOptions) => {
  // Stabilize object references to prevent infinite loops
  const stableOrderBy = useMemo(() => orderBy, [JSON.stringify(orderBy)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0
  });

  // Fetch data with pagination
  const fetchData = useCallback(async (page = 1, customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .select(select, { count: 'exact' })
        .range(from, to)
        .order(stableOrderBy.column, { ascending: stableOrderBy.ascending });

      // Apply filters
      const allFilters = { ...stableFilters, ...customFilters };
      Object.entries(allFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data: result, error, count } = await query;

      if (error) throw error;

      setData(result || []);
      setPagination({
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [table, select, stableOrderBy, stableFilters, pageSize]);

  // Create item
  const create = useCallback(async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(item)
        .select()
        .single();

      if (error) throw error;

      setData(prev => [result, ...prev]);
      toast.success('Item criado com sucesso!');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar item';
      toast.error(errorMessage);
      throw err;
    }
  }, [table]);

  // Update item
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<T> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => prev.map(item => item.id === id ? result : item));
      toast.success('Item atualizado com sucesso!');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar item';
      toast.error(errorMessage);
      throw err;
    }
  }, [table]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== id));
      toast.success('Item removido com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover item';
      toast.error(errorMessage);
      throw err;
    }
  }, [table]);

  // Get single item
  const getById = useCallback(async (id: string): Promise<T | null> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar item';
      toast.error(errorMessage);
      return null;
    }
  }, [table, select]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData(pagination.page);
  }, [fetchData, pagination.page]);

  // Change page
  const changePage = useCallback((page: number) => {
    fetchData(page);
  }, [fetchData]);

  // Search/filter
  const search = useCallback((searchFilters: Record<string, any>) => {
    fetchData(1, searchFilters);
  }, [fetchData]);

  // Setup realtime subscription
  useEffect(() => {
    if (!realtime) return;

    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, realtime, refresh]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const operations: CRUDOperations<T> = {
    create,
    update,
    remove,
    getById,
    refresh,
    changePage,
    search
  };

  return {
    data,
    loading,
    error,
    pagination,
    createItem: create,
    updateItem: update,
    deleteItem: remove,
    refetch: refresh,
    ...operations
  };
};