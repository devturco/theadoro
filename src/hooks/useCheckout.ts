import { useState, useCallback } from 'react';
import { CartItem } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CheckoutData {
  // Customer Information
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Shipping Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Billing Address (optional, if different from shipping)
  billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Payment Information
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'boleto';
  
  // Additional Options
  notes?: string;
  giftMessage?: string;
  isGift?: boolean;
}

export interface Order {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  checkoutData: CheckoutData;
  createdAt: string;
  updatedAt: string;
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const calculateShipping = useCallback((items: CartItem[], address: CheckoutData) => {
    // Simple shipping calculation logic
    // In a real app, this would integrate with shipping APIs
    const hasPhysicalItems = items.some(item => !item.product.is_service);
    
    if (!hasPhysicalItems) {
      return 0; // No shipping for services
    }

    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Free shipping for orders over R$ 200
    if (subtotal >= 200) {
      return 0;
    }

    // Basic shipping calculation based on location
    const baseShipping = 15;
    const stateMultiplier = address.state === 'SP' ? 1 : 1.5;
    
    return baseShipping * stateMultiplier;
  }, []);

  const calculateTax = useCallback((subtotal: number) => {
    // Simple tax calculation (in Brazil, this would be more complex)
    return subtotal * 0.05; // 5% tax
  }, []);

  const validateCheckoutData = useCallback((data: CheckoutData): string[] => {
    const errors: string[] = [];

    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.push('Email válido é obrigatório');
    }

    if (!data.firstName.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!data.lastName.trim()) {
      errors.push('Sobrenome é obrigatório');
    }

    if (!data.phone.trim()) {
      errors.push('Telefone é obrigatório');
    }

    if (!data.address.trim()) {
      errors.push('Endereço é obrigatório');
    }

    if (!data.city.trim()) {
      errors.push('Cidade é obrigatória');
    }

    if (!data.state.trim()) {
      errors.push('Estado é obrigatório');
    }

    if (!data.zipCode.trim()) {
      errors.push('CEP é obrigatório');
    }

    if (!data.country.trim()) {
      errors.push('País é obrigatório');
    }

    if (!data.paymentMethod) {
      errors.push('Método de pagamento é obrigatório');
    }

    return errors;
  }, []);

  const processOrder = useCallback(async (
    items: CartItem[],
    checkoutData: CheckoutData
  ): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      // Validate checkout data
      const validationErrors = validateCheckoutData(checkoutData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Validate items
      if (!items || items.length === 0) {
        throw new Error('Carrinho vazio');
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shipping = calculateShipping(items, checkoutData);
      const tax = calculateTax(subtotal);
      const total = subtotal + shipping + tax;

      // Create order in database
      const orderData = {
        user_id: user?.id || null,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          variant_id: item.variant?.id || null,
        })),
        subtotal,
        shipping,
        tax,
        total,
        status: 'pending',
        customer_data: {
          email: checkoutData.email,
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          phone: checkoutData.phone,
        },
        shipping_address: {
          address: checkoutData.address,
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode,
          country: checkoutData.country,
        },
        billing_address: checkoutData.billingAddress || {
          address: checkoutData.address,
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode,
          country: checkoutData.country,
        },
        payment_method: checkoutData.paymentMethod,
        notes: checkoutData.notes || null,
        gift_message: checkoutData.giftMessage || null,
        is_gift: checkoutData.isGift || false,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: data.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        variant_id: item.variant?.id || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock_quantity: item.product.stock_quantity - item.quantity
          })
          .eq('id', item.product.id);

        if (stockError) {
          console.error('Error updating stock:', stockError);
        }
      }

      const order: Order = {
        id: data.id,
        userId: data.user_id,
        items,
        subtotal,
        shipping,
        tax,
        total,
        status: data.status,
        checkoutData,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido #${data.id.slice(0, 8)} foi criado. Você receberá um email de confirmação.`,
      });

      return order;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pedido';
      setError(errorMessage);
      toast({
        title: "Erro no checkout",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, calculateShipping, calculateTax, validateCheckoutData]);

  const getOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              *,
              categories (
                id,
                name,
                slug
              ),
              profiles (
                id,
                full_name,
                avatar_url,
                location
              )
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // Transform data to match Order interface
      const items: CartItem[] = data.order_items.map((item: any) => ({
        id: item.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          description: item.products.description,
          price: item.price, // Use the price from order_items (historical price)
          original_price: item.products.original_price,
          images: item.products.images || [],
          rating: item.products.rating || 0,
          review_count: item.products.review_count || 0,
          in_stock: item.products.in_stock,
          stock_quantity: item.products.stock_quantity || 0,
          tags: item.products.tags || [],
          is_service: item.products.is_service,
          created_at: item.products.created_at,
          updated_at: item.products.updated_at,
          category: item.products.categories || {
            id: '',
            name: 'Sem categoria',
            slug: 'sem-categoria',
          },
          seller: {
            id: item.products.profiles?.id || '',
            name: item.products.profiles?.full_name || 'Vendedor',
            avatar: item.products.profiles?.avatar_url,
            location: item.products.profiles?.location || '',
            rating: 0,
            reviewCount: 0,
            verified: false,
            specialties: [],
            responseTime: '',
            joinedAt: '',
            description: '',
          }
        },
        quantity: item.quantity,
        addedAt: item.created_at,
      }));

      const order: Order = {
        id: data.id,
        userId: data.user_id,
        items,
        subtotal: data.subtotal,
        shipping: data.shipping,
        tax: data.tax,
        total: data.total,
        status: data.status,
        checkoutData: {
          email: data.customer_data.email,
          firstName: data.customer_data.firstName,
          lastName: data.customer_data.lastName,
          phone: data.customer_data.phone,
          address: data.shipping_address.address,
          city: data.shipping_address.city,
          state: data.shipping_address.state,
          zipCode: data.shipping_address.zipCode,
          country: data.shipping_address.country,
          billingAddress: data.billing_address,
          paymentMethod: data.payment_method,
          notes: data.notes,
          giftMessage: data.gift_message,
          isGift: data.is_gift,
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return order;

    } catch (err) {
      console.error('Error fetching order:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    processOrder,
    getOrderById,
    calculateShipping,
    calculateTax,
    validateCheckoutData,
  };
};