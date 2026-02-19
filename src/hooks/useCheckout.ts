import { useState, useCallback } from 'react';
import { CartItem } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LoggiService, ShippingQuote } from '@/services/LoggiService';
import { PaymentService } from '@/services/PaymentService';
import { EmailService } from '@/services/EmailService';

export interface CheckoutData {
  // Customer Information
  email: string;
  firstName: string;
  lastName: string;
  phone: string;

  // Shipping Address
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  address?: string; // Legacy/Composite

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
  paymentDetails?: {
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
    installments?: number;
  };

  // Additional Options
  notes?: string;
  giftMessage?: string;
  isGift?: boolean;
  giftOptions?: any; // GiftOptions;
  deliverySchedule?: any; // DeliverySchedule;

  // Save options
  saveProfile?: boolean;
  saveAddress?: boolean;
  addressLabel?: string;
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
  gift_options?: any;
  delivery_schedule?: any;
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);
  const { user } = useAuth();

  const getShippingQuotes = useCallback(async (items: CartItem[], zipCode: string) => {
    try {
      setLoading(true);
      // Map items to ShippingRequest format
      const shippingItems = items.map(item => ({
        id: item.product.id,
        quantity: item.quantity
      }));

      const quotes = await LoggiService.calculateShipping({ zipCode, items: shippingItems });

      // Fetch Site Settings for Uber
      const { data: settings } = await (supabase.from as any)('site_settings')
        .select('*')
        .in('key', ['shipping_uber_enabled', 'shipping_express_tariff']);

      const uberEnabled = settings?.find(s => s.key === 'shipping_uber_enabled')?.value === true || settings?.find(s => s.key === 'shipping_uber_enabled')?.value === 'true';
      const expressTariff = Number(settings?.find(s => s.key === 'shipping_express_tariff')?.value || 0);

      // Add Seller Delivery option if enabled for this seller
      const firstItem = items[0];
      if (firstItem && firstItem.product.seller_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('seller_delivery_enabled')
          .eq('id', firstItem.product.seller_id)
          .single();

        if (sellerData && (sellerData as any).seller_delivery_enabled) {
          quotes.push({
            id: 'seller-delivery',
            name: 'Entrega Própria (Sede do Vendedor)',
            price: 0, // Combinar ou valor fixo?
            estimated_delivery: 'A combinar com vendedor',
            company: {
              name: 'Vendedor',
              logo_url: ''
            }
          } as any);
        }
      }

      // Add Uber Direct if enabled
      if (uberEnabled) {
        quotes.push({
          id: 'uber-direct',
          name: `Uber Flash (Express) ${expressTariff > 0 ? `+${expressTariff}%` : ''}`,
          price: 18.90 * (1 + (expressTariff / 100)), // Simulate Uber base + tariff
          estimated_delivery: 'Entrega em até 90 min',
          company: {
            name: 'Uber',
            logo_url: '/uber-logo.png'
          }
        } as any);
      }

      setShippingQuotes(quotes);

      // Default select the cheapest option
      if (quotes.length > 0) {
        setSelectedShipping(quotes.reduce((prev, curr) => prev.price < curr.price ? prev : curr));
      }
      return quotes;
    } catch (err) {
      console.error('Error fetching shipping quotes:', err);
      toast({
        title: "Erro no frete",
        description: "Não foi possível calcular o frete para este CEP.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
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

    if (!data.firstName.trim()) errors.push('Nome é obrigatório');
    if (!data.lastName.trim()) errors.push('Sobrenome é obrigatório');
    if (!data.phone.trim()) errors.push('Telefone é obrigatório');
    if (!data.address.trim()) errors.push('Endereço é obrigatório');
    if (!data.city.trim()) errors.push('Cidade é obrigatória');
    if (!data.state.trim()) errors.push('Estado é obrigatório');
    if (!data.zipCode.trim()) errors.push('CEP é obrigatório');
    if (!data.country.trim()) errors.push('País é obrigatório');
    if (!data.paymentMethod) errors.push('Método de pagamento é obrigatório');

    return errors;
  }, []);

  const processOrder = useCallback(async (
    items: CartItem[],
    checkoutData: CheckoutData
  ): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Validate Data
      const validationErrors = validateCheckoutData(checkoutData);

      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      if (!items || items.length === 0) throw new Error('Carrinho vazio');

      // 2. Calculate Totals
      const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shipping = selectedShipping?.price || 0;

      // Calculate Gift Wrap Price from DB to ensure accuracy
      let giftWrapPrice = 0;
      let giftWrapName = '';
      let giftWrapImage = '';
      if (checkoutData.giftOptions?.is_gift && checkoutData.giftOptions?.wrap_style_id) {
        const { data: wrapData } = await supabase
          .from('gift_wraps' as any)
          .select('name, price, image_url')
          .eq('id', checkoutData.giftOptions.wrap_style_id)
          .single();
        giftWrapPrice = (wrapData as any)?.price ? Number((wrapData as any).price) : 0;
        giftWrapName = (wrapData as any)?.name || '';
        giftWrapImage = (wrapData as any)?.image_url || '';
      }

      // Calculate Discount based on payment method
      let discount = 0;
      if (checkoutData.paymentMethod === 'pix') {
        discount = (subtotal + shipping + giftWrapPrice) * 0.05;
      } else if (checkoutData.paymentMethod === 'boleto') {
        discount = (subtotal + shipping + giftWrapPrice) * 0.03;
      }

      const total = subtotal + shipping + giftWrapPrice - discount;
      const tax = 0; // Tax is currently not part of the active pricing model but kept for interface consistency

      // 3. Process Payment
      const customerData = {
        name: `${checkoutData.firstName} ${checkoutData.lastName}`.trim(),
        email: checkoutData.email,
        phone: checkoutData.phone,
        document: user?.user_metadata?.cpf || '00000000000' // TODO: Ensure CPF is collected in checkout if not in profile
      };

      let paymentResult;
      if (checkoutData.paymentMethod === 'credit_card' || checkoutData.paymentMethod === 'debit_card') {
        if (!checkoutData.paymentDetails?.cardNumber) throw new Error('Dados do cartão incompletos');

        paymentResult = await PaymentService.processCard(total, {
          number: checkoutData.paymentDetails.cardNumber,
          name: checkoutData.paymentDetails.cardName || '',
          expiry: checkoutData.paymentDetails.cardExpiry || '',
          cvv: checkoutData.paymentDetails.cardCvv || '',
          installments: checkoutData.paymentDetails.installments || 1
        }, customerData);
      } else if (checkoutData.paymentMethod === 'pix') {
        paymentResult = await PaymentService.generatePix(total, customerData);
      } else {
        // Boleto
        paymentResult = await PaymentService.generateBoleto(total, customerData);
      }

      if (paymentResult.status === 'failed') {
        throw new Error('Pagamento recusado. Verifique os dados e tente novamente.');
      }

      // 3.5 Save User Data & Address if requested
      if (user?.id) {
        if (checkoutData.saveProfile) {
          const { error: profileErr } = await supabase.from('profiles').update({
            full_name: `${checkoutData.firstName} ${checkoutData.lastName}`.trim(),
            phone: checkoutData.phone,
            address: checkoutData.street,
            address_number: checkoutData.number,
            address_complement: checkoutData.complement || '',
            neighborhood: checkoutData.neighborhood || '',
            city: checkoutData.city,
            state: checkoutData.state,
            postal_code: checkoutData.zipCode,
          }).eq('id', user.id);
          if (profileErr) console.error('Error updating profile:', profileErr);
        }

        if (checkoutData.saveAddress) {
          const { error: addressError } = await supabase.from('user_addresses' as any).insert({
            user_id: user.id,
            label: checkoutData.addressLabel || 'Meu Endereço',
            zip_code: checkoutData.zipCode,
            street: checkoutData.street,
            number: checkoutData.number,
            complement: checkoutData.complement || '',
            neighborhood: checkoutData.neighborhood || '',
            city: checkoutData.city,
            state: checkoutData.state,
            is_default: false
          });
          if (addressError) console.error('Error saving address:', addressError);
        }
      }

      // 4. Create Order in DB
      const notesJson = JSON.stringify({
        customer: {
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          phone: checkoutData.phone,
          email: checkoutData.email
        },
        billingAddress: checkoutData.billingAddress,
        userNote: checkoutData.notes,
        giftOptions: {
          ...checkoutData.giftOptions,
          wrap_style_name: giftWrapName,
          wrap_style_image: giftWrapImage
        },
        deliverySchedule: checkoutData.deliverySchedule,
        paymentInfo: {
          id: paymentResult.id,
          pixCode: paymentResult.pix_code,
          boletoUrl: paymentResult.boleto_url
        }
      });

      const orderData = {
        buyer_id: user?.id || null,
        seller_id: items[0]?.product.seller?.id || (items[0]?.product as any).seller_id || null,
        total_amount: total,
        subtotal_amount: subtotal,
        shipping_cost: shipping,
        gift_wrap_price: giftWrapPrice,
        discount_amount: discount,
        tax_amount: tax,
        shipping_method: selectedShipping?.name || 'Padrão',
        status: 'pending' as 'pending',
        shipping_address: JSON.stringify({
          street: checkoutData.street,
          number: checkoutData.number,
          complement: checkoutData.complement,
          neighborhood: checkoutData.neighborhood,
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode,
          country: checkoutData.country,
        }),
        payment_method: checkoutData.paymentMethod,
        notes: notesJson,
      };

      const { data, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation FAILED:', orderError);
        throw orderError;
      }

      // 5. Create Order Items
      const orderItems = items.map(item => {
        const itemSellerId = item.product.seller?.id || (item.product as any).seller_id;

        return {
          order_id: data.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.quantity * item.product.price,
          variant_id: item.variant?.id || null,
          seller_id: itemSellerId || '00000000-0000-0000-0000-000000000000',
          gift_message: checkoutData.giftOptions?.message || checkoutData.giftMessage || null,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items insertion FAILED:', itemsError);
        throw itemsError;
      }

      // 6. Create Appointments for Services
      for (const item of items) {
        if (item.product.is_service) {
          const { error: apptError } = await supabase.from('appointments').insert({
            buyer_id: user?.id,
            seller_id: item.product.seller?.id || (item.product as any).seller_id,
            product_id: item.product.id,
            appointment_date: checkoutData.deliverySchedule?.scheduled_date || new Date().toISOString().split('T')[0],
            appointment_time: checkoutData.deliverySchedule?.scheduled_slot || '09:00',
            service_address: `${checkoutData.street}, ${checkoutData.number}${checkoutData.complement ? ', ' + checkoutData.complement : ''}`,
            status: 'pending',
            notes: `Agendamento automático via pedido #${data.id.slice(0, 8)}. Mensagem: ${checkoutData.giftMessage || 'N/A'}`
          });
          if (apptError) console.error('Error creating automatic appointment:', apptError);
        }
      }

      // 7. Update Stock (Only for physical products)
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

      // 7. Send Confirmation Email
      await EmailService.send({
        to: checkoutData.email,
        subject: `Pedido #${data.id.slice(0, 8)} Confirmado!`,
        template: 'order_confirmation',
        data: {
          orderId: data.id,
          items: items.map(i => i.product.name),
          total: total
        }
      });

      const order: Order = {
        id: data.id,
        userId: data.buyer_id, // Changed from user_id to buyer_id
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
        description: `Seu pedido #${data.id.slice(0, 8)} foi criado.`,
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
  }, [user, selectedShipping, calculateTax, validateCheckoutData]);

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

      // Parse JSON fields
      const notesData = data.notes ? JSON.parse(data.notes as string) : {};
      const shippingAddressData = typeof data.shipping_address === 'string'
        ? JSON.parse(data.shipping_address)
        : data.shipping_address;

      // Transform data to match Order interface
      const items: CartItem[] = data.order_items.map((item: any) => ({
        id: item.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          description: item.products.description,
          price: item.unit_price || item.products.price, // Use unit_price from order_items
          original_price: item.products.original_price,
          seller_id: item.products.seller_id,
          images: item.products.images || [],
          rating: item.products.rating || 0,
          review_count: item.products.review_count || 0,
          in_stock: item.products.in_stock,
          stock_quantity: item.products.stock_quantity || 0,
          is_active: item.products.is_active ?? true,
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
        userId: data.buyer_id, // Changed from user_id to buyer_id
        items,
        subtotal: 0, // Should be calculated or stored
        shipping: 0, // Should be stored?
        tax: 0, // Should be stored?
        total: data.total_amount, // Changed from total to total_amount
        status: data.status,
        checkoutData: {
          email: notesData.customer?.email || '',
          firstName: notesData.customer?.firstName || '',
          lastName: notesData.customer?.lastName || '',
          phone: notesData.customer?.phone || '',
          street: shippingAddressData?.street || '',
          number: shippingAddressData?.number || '',
          complement: shippingAddressData?.complement || '',
          city: shippingAddressData?.city || '',
          state: shippingAddressData?.state || '',
          zipCode: shippingAddressData?.zipCode || '',
          country: shippingAddressData?.country || 'Brasil',
          billingAddress: notesData.billingAddress,
          paymentMethod: data.payment_method as any,
          notes: notesData.userNote,
          giftMessage: notesData.giftOptions?.message,
          isGift: !!notesData.giftOptions?.is_gift,
          giftOptions: notesData.giftOptions,
          deliverySchedule: notesData.deliverySchedule
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        gift_options: notesData.giftOptions,
        delivery_schedule: notesData.deliverySchedule
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
    getShippingQuotes,
    shippingQuotes,
    selectedShipping,
    setSelectedShipping,
    calculateTax,
    validateCheckoutData,
  };
};