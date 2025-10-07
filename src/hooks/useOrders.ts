import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCRUD } from './useCRUD';
import type { Order, OrderStatus, OrderItem } from '@/types/order';

export const useOrders = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const {
    data: orders,
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
  } = useCRUD<Order>({
    table: 'orders',
    select: `
      *,
      buyer:profiles!buyer_id(id, full_name, email, phone),
      seller:profiles!seller_id(id, full_name, email, phone),
      order_items(
        id,
        quantity,
        unit_price,
        total_price,
        product:products(id, name, images, price)
      )
    `,
    orderBy: { column: 'created_at', ascending: false },
    realtime: true,
    pageSize: 10
  });

  // Create order with items
  const createOrder = useCallback(async (orderData: {
    buyer_id: string;
    seller_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    delivery_address?: string;
    notes?: string;
  }): Promise<Order> => {
    try {
      const { items, ...orderInfo } = orderData;
      
      // Calculate total
      const total_amount = items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );

      // Create order
      const order = await create({
        ...orderInfo,
        total_amount,
        status: 'pending' as OrderStatus
      } as any);

      // Create order items
      const orderItemsData = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      toast.success('Pedido criado com sucesso!');
      return order;
    } catch (error) {
      throw error;
    }
  }, [create]);

  // Update order status
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    status: OrderStatus,
    notes?: string
  ): Promise<void> => {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      await update(orderId, updateData);
      
      const statusMessages = {
        pending: 'Pedido marcado como pendente',
        confirmed: 'Pedido confirmado',
        preparing: 'Pedido em preparação',
        ready: 'Pedido pronto para entrega',
        delivered: 'Pedido entregue',
        cancelled: 'Pedido cancelado'
      };

      toast.success(statusMessages[status] || 'Status do pedido atualizado');
    } catch (error) {
      throw error;
    }
  }, [update]);

  // Get orders by buyer
  const getOrdersByBuyer = useCallback(async (buyerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!seller_id(id, full_name, email, phone),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            product:products(id, name, images, price)
          )
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching buyer orders:', err);
      toast.error('Erro ao carregar pedidos do comprador');
      return [];
    }
  }, []);

  // Get orders by seller
  const getOrdersBySeller = useCallback(async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(id, full_name, email, phone),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            product:products(id, name, images, price)
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching seller orders:', err);
      toast.error('Erro ao carregar pedidos do vendedor');
      return [];
    }
  }, []);

  // Get order items
  const getOrderItems = useCallback(async (orderId: string) => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(id, name, images, price, description)
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      setOrderItems(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching order items:', err);
      toast.error('Erro ao carregar itens do pedido');
      return [];
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Get order statistics
  const getOrderStats = useCallback(async (sellerId?: string) => {
    try {
      let query = supabase
        .from('orders')
        .select('status, total_amount, created_at');

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(o => o.status === 'pending').length || 0,
        confirmed: data?.filter(o => o.status === 'confirmed').length || 0,
        delivered: data?.filter(o => o.status === 'delivered').length || 0,
        cancelled: data?.filter(o => o.status === 'cancelled').length || 0,
        totalRevenue: data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      };

      return stats;
    } catch (err) {
      console.error('Error fetching order stats:', err);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0
      };
    }
  }, []);

  // Search orders
  const searchOrders = useCallback((query: string) => {
    search({ 
      id: `%${query}%`
    });
  }, [search]);

  // Filter orders by status
  const filterByStatus = useCallback((status: OrderStatus) => {
    search({ status });
  }, [search]);

  // Filter orders by date range
  const filterByDateRange = useCallback((startDate: string, endDate: string) => {
    search({
      created_at: `gte.${startDate}`,
      created_at_end: `lte.${endDate}`
    });
  }, [search]);

  return {
    orders,
    loading,
    error,
    pagination,
    orderItems,
    loadingItems,
    createOrder,
    updateOrder: update,
    deleteOrder: remove,
    getOrder: getById,
    updateOrderStatus,
    getOrdersByBuyer,
    getOrdersBySeller,
    getOrderItems,
    getOrderStats,
    searchOrders,
    filterByStatus,
    filterByDateRange,
    refresh,
    changePage
  };
};