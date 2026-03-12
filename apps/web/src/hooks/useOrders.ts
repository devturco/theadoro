import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Order,
  OrderStatus,
  OrderItem,
  OrderFilters,
  OrderStats
} from '@/types/order';
import { orderService } from '@/services/order.service';
import { useAuth } from '@/contexts/AuthContext';

interface UseOrdersOptions {
  scope?: 'admin' | 'buyer' | 'seller';
  fetchOnMount?: boolean;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const { scope = 'admin', fetchOnMount = true } = options;
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<OrderFilters>({});

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Fetch orders based on current scope and filters
   */
  const fetchOrders = useCallback(async () => {
    if (!user && scope !== 'admin') return;

    setLoading(true);
    setError(null);

    try {
      let result;
      const currentFilters = { ...filters };

      // Apply scope-specific filters
      if (scope === 'buyer' && user) {
        currentFilters.buyer_id = user.id;
      } else if (scope === 'seller' && user) {
        currentFilters.seller_id = user.id;
      }

      const { data, count, error } = await orderService.getOrdersWithRelations(
        currentFilters,
        { page, limit: pageSize }
      );

      if (error) throw error;

      setOrders(data || []);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, scope, filters, page, pageSize]);

  /**
   * Fetch order stats based on current scope
   */
  const fetchStats = useCallback(async () => {
    try {
      const statsFilters: { buyer_id?: string; seller_id?: string } = {};

      if (scope === 'buyer' && user) {
        statsFilters.buyer_id = user.id;
      } else if (scope === 'seller' && user) {
        statsFilters.seller_id = user.id;
      }

      const { data, error } = await orderService.getOrderStats(statsFilters);
      if (error) throw error;
      setStats(data);
      return data;
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      return null;
    }
  }, [scope, user]);

  /**
   * Create order
   */
  const createOrder = useCallback(async (
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number' | 'items'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ) => {
    setLoading(true);
    try {
      const { data, error } = await orderService.createOrderWithItems(orderData, items);

      if (error) throw error;

      toast.success('Pedido criado com sucesso!');

      // Refresh list if appropriate
      if (scope === 'buyer' || scope === 'admin') {
        fetchOrders();
      }

      return data;
    } catch (err: any) {
      console.error('Error creating order:', err);
      toast.error('Erro ao criar pedido: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, scope]);

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ) => {
    try {
      const { data, error } = await orderService.updateOrderStatus(orderId, status, trackingNumber);

      if (error) throw error;

      toast.success('Status do pedido atualizado');

      // Update local state without refetching everything
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

      return data;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error('Erro ao atualizar status');
      throw err;
    }
  }, []);

  /**
   * Cancel order
   */
  const deleteOrder = useCallback(async (orderId: string) => { // Kept name deleteOrder for compatibility, but acts as cancel/soft delete usually? 
    // Wait, the original useCRUD had 'remove' which is hard delete. 
    // But for Orders, we usually don't delete. 
    // However, AdminOrders.tsx uses deleteOrder.
    // I will implement it as hard delete via service if exposed, or soft if prefered.
    // OrderService inherits delete from BaseService.
    try {
      const { error } = await orderService.delete(orderId);
      if (error) throw error;

      toast.success('Pedido removido');
      fetchOrders();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      toast.error('Erro ao remover pedido');
      throw err;
    }
  }, [fetchOrders]);

  /**
   * Get single order details
   */
  const getOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await orderService.getOrderWithItems(orderId);
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching order:', err);
      toast.error('Erro ao carregar detalhes do pedido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get order items (specific method if needed independent of getOrder)
   */
  const getOrderItems = useCallback(async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data: order, error } = await orderService.getOrderWithItems(orderId);
      if (error) throw error;
      setItems(order?.items || []);
      return order?.items || [];
    } catch (err: any) {
      console.error('Error fetching items:', err);
      return [];
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Filter helpers
  const filterByStatus = useCallback((status: OrderStatus | 'all') => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status
    }));
    setPage(1); // Reset page on filter change
  }, []);

  const filterByDateRange = useCallback((startDate: string, endDate: string) => {
    setFilters(prev => ({
      ...prev,
      date_from: startDate,
      date_to: endDate
    }));
    setPage(1);
  }, []);

  const searchOrders = useCallback((query: string) => {
    setFilters(prev => ({
      ...prev,
      search: query
    }));
    setPage(1);
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchOrders();
    }
  }, [fetchOnMount, fetchOrders]);

  return {
    orders,
    loading,
    error,
    stats,
    items,
    loadingItems,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      setPage,
      setPageSize
    },
    fetchOrders,
    fetchStats,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    getOrder,
    getOrderItems,
    filterByStatus,
    filterByDateRange,
    searchOrders,
    refresh: fetchOrders
  };
};
