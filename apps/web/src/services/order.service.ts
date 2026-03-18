import { BaseService } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Order, OrderItem, OrderStats, OrderFilters, OrderStatus } from '@/types/order';

class OrderService extends BaseService<Order> {
  constructor() {
    super('orders');
  }

  /**
   * Get orders with relations (buyer, seller, items)
   */
  async getOrdersWithRelations(
    filters: OrderFilters = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: Order[]; count: number; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(id, full_name, email, avatar_url),
          seller:profiles!orders_seller_id_fkey(id, full_name, email, avatar_url),
          payments(
            id,
            provider,
            provider_transaction_id,
            status,
            metadata,
            created_at
          ),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product:products(id, name, images, seller_id)
          )
        `, { count: 'exact' });

      // ... (filters rest identical)
      if (filters.buyer_id) {
        query = query.eq('buyer_id', filters.buyer_id);
      }

      if (filters.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.min_amount) {
        query = query.gte('total_amount', filters.min_amount);
      }

      if (filters.max_amount) {
        query = query.lte('total_amount', filters.max_amount);
      }

      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      return {
        data: data as Order[] || [],
        count: count || 0,
        error
      };
    } catch (error) {
      console.error('Error getting orders with relations:', error);
      return {
        data: [],
        count: 0,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(filters: { buyer_id?: string; seller_id?: string } = {}): Promise<{ data: OrderStats | null; error: PostgrestError | null }> {
    try {
      const { buyer_id, seller_id } = filters;

      const buildQuery = (status?: string) => {
        let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });
        if (buyer_id) query = query.eq('buyer_id', buyer_id);
        if (seller_id) query = query.eq('seller_id', seller_id);
        if (status) query = query.eq('status', status);
        return query;
      };

      // Get total orders
      const { count: totalOrders, error: totalError } = await buildQuery();
      if (totalError) throw totalError;

      // Get orders by status
      const statusCounts = await Promise.all([
        buildQuery('pending'),
        buildQuery('confirmed'),
        buildQuery('shipped'),
        buildQuery('delivered'),
        buildQuery('cancelled')
      ]);

      const [pendingResult, confirmedResult, shippedResult, deliveredResult, cancelledResult] = statusCounts;

      if (statusCounts.some(result => result.error)) {
        throw statusCounts.find(result => result.error)?.error;
      }

      // Get revenue statistics
      let revenueQuery = supabase
        .from(this.tableName)
        .select('total_amount, created_at')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);

      if (buyer_id) revenueQuery = revenueQuery.eq('buyer_id', buyer_id);
      if (seller_id) revenueQuery = revenueQuery.eq('seller_id', seller_id);

      const { data: revenueData, error: revenueError } = await revenueQuery;

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders && totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get this month's data
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      let thisMonthQuery = supabase
        .from(this.tableName)
        .select('total_amount')
        .gte('created_at', startOfMonth.toISOString())
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);

      if (buyer_id) thisMonthQuery = thisMonthQuery.eq('buyer_id', buyer_id);
      if (seller_id) thisMonthQuery = thisMonthQuery.eq('seller_id', seller_id);

      const { data: thisMonthData, error: thisMonthError } = await thisMonthQuery;

      if (thisMonthError) throw thisMonthError;

      const ordersThisMonth = thisMonthData?.length || 0;
      const revenueThisMonth = thisMonthData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Calculate growth percentage (compared to last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      let lastMonthQuery = supabase
        .from(this.tableName)
        .select('total_amount')
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString())
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);

      if (buyer_id) lastMonthQuery = lastMonthQuery.eq('buyer_id', buyer_id);
      if (seller_id) lastMonthQuery = lastMonthQuery.eq('seller_id', seller_id);

      const { data: lastMonthData, error: lastMonthError } = await lastMonthQuery;

      if (lastMonthError) throw lastMonthError;

      const revenueLastMonth = lastMonthData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const growthPercentage = revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

      const stats: OrderStats = {
        total_orders: totalOrders || 0,
        pending_orders: pendingResult.count || 0,
        confirmed_orders: confirmedResult.count || 0,
        shipped_orders: shippedResult.count || 0,
        delivered_orders: deliveredResult.count || 0,
        cancelled_orders: cancelledResult.count || 0,
        total_revenue: totalRevenue,
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        orders_this_month: ordersThisMonth,
        revenue_this_month: revenueThisMonth,
        growth_percentage: Math.round(growthPercentage * 100) / 100
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting order stats:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Create order with items
   */
  async createOrderWithItems(
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number' | 'items'>,
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ): Promise<{ data: Order | null; error: PostgrestError | null }> {
    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const { data: order, error: orderError } = await this.create({
        ...orderData,
        order_number: orderNumber
      });

      if (orderError || !order) {
        return { data: null, error: orderError };
      }

      // Create order items
      const orderItems = items.map(item => ({
        ...item,
        order_id: order.id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // Rollback order creation
        await this.delete(order.id);
        return { data: null, error: itemsError };
      }

      // Return order with items
      const { data: completeOrder, error: fetchError } = await this.getOrderWithItems(order.id);

      return {
        data: completeOrder,
        error: fetchError
      };
    } catch (error) {
      console.error('Error creating order with items:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Create order with items and handle business logic (stock, appointments)
   */
  async createOrderWithItemsAndLogic(
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number' | 'items'>,
    items: { product: any; quantity: number; variant?: any; gift_message?: string }[],
    options: { updateStock?: boolean; createAppointments?: boolean; deliverySchedule?: any } = {}
  ): Promise<{ data: Order | null; error: Error | PostgrestError | null }> {
    try {
      // 1. Create the order using existing method or inline logic
      const orderItemsData = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.quantity * item.product.price,
        variant_id: item.variant?.id || null,
        seller_id: item.product.seller_id || item.product.seller?.id || '00000000-0000-0000-0000-000000000000',
        gift_message: item.gift_message || null
      }));

      const { data: order, error: orderError } = await this.createOrderWithItems(
        orderData,
        orderItemsData
      );

      if (orderError || !order) return { data: null, error: orderError };

      // 2. Handle Stock Updates
      if (options.updateStock) {
        for (const item of items) {
          if (!item.product.is_service && item.product.stock_quantity !== null) {
            await supabase
              .from('products')
              .update({
                stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity)
              })
              .eq('id', item.product.id);
          }
        }
      }

      // 3. Handle Appointments for Services
      if (options.createAppointments) {
        for (const item of items) {
          if (item.product.is_service) {
            const shippingAddr = typeof order.shipping_address === 'string'
              ? JSON.parse(order.shipping_address)
              : order.shipping_address;

            await supabase.from('appointments').insert({
              buyer_id: order.buyer_id,
              seller_id: item.product.seller_id || item.product.seller?.id,
              product_id: item.product.id,
              appointment_date: options.deliverySchedule?.scheduled_date || new Date().toISOString().split('T')[0],
              appointment_time: options.deliverySchedule?.scheduled_slot || '09:00',
              service_address: shippingAddr ? `${shippingAddr.street}, ${shippingAddr.number || ''}` : '',
              status: 'pending',
              notes: `Agendamento automático via pedido #${order.id.slice(0, 8)}.`
            });
          }
        }
      }

      return { data: order, error: null };
    } catch (error: any) {
      console.error('Error in createOrderWithItemsAndLogic:', error);
      return { data: null, error };
    }
  }

  /**
   * Get order with items
   */
  async getOrderWithItems(orderId: string): Promise<{ data: Order | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(id, full_name, email, avatar_url),
          seller:profiles!orders_seller_id_fkey(id, full_name, email, avatar_url),
          payments(
            id,
            provider,
            provider_transaction_id,
            status,
            metadata,
            created_at
          ),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product:products(id, name, images, seller_id)
          )
        `)
        .eq('id', orderId)
        .single();

      return {
        data: data as Order,
        error
      };
    } catch (error) {
      console.error('Error getting order with items:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<{ data: Order | null; error: PostgrestError | null }> {
    try {
      const updateData: any = { status };

      if (status === 'shipped' && trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      return this.update(orderId, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<{ data: Order | null; error: PostgrestError | null }> {
    try {
      return this.update(orderId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get orders by buyer
   */
  async getOrdersByBuyer(buyerId: string): Promise<{ data: Order[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          seller:profiles!orders_seller_id_fkey(id, full_name, email, avatar_url),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product:products(id, name, images)
          )
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      return {
        data: data as Order[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting orders by buyer:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get orders by seller
   */
  async getOrdersBySeller(sellerId: string): Promise<{ data: Order[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(id, full_name, email, avatar_url),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product:products(id, name, images)
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      return {
        data: data as Order[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting orders by seller:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 10): Promise<{ data: Order[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(id, full_name, email, avatar_url),
          seller:profiles!orders_seller_id_fkey(id, full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return {
        data: data as Order[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting recent orders:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get sales report data
   */
  async getSalesReport(
    startDate: string,
    endDate: string,
    sellerId?: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          created_at,
          total_amount,
          status,
          items:order_items(quantity, unit_price, total_price)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error };
      }

      // Process data for report
      const reportData = {
        total_orders: data?.length || 0,
        total_revenue: data?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
        total_items_sold: data?.reduce((sum: number, order: any) =>
          sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
        ) || 0,
        daily_sales: this.groupSalesByDay(data || []),
        status_breakdown: this.groupSalesByStatus(data || [])
      };

      return { data: reportData, error: null };
    } catch (error) {
      console.error('Error getting sales report:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Group sales by day for charts
   */
  private groupSalesByDay(orders: any[]): any[] {
    const dailySales = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total_amount;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(dailySales).sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Group sales by status
   */
  private groupSalesByStatus(orders: any[]): any[] {
    const statusBreakdown = orders.reduce((acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = { status: order.status, count: 0, revenue: 0 };
      }
      acc[order.status].count += 1;
      acc[order.status].revenue += order.total_amount;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(statusBreakdown);
  }
}

export const orderService = new OrderService();
