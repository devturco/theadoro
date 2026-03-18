import { useState, useCallback } from 'react';
import { CartItem } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { shippingService, ShippingOption } from '@/services/shippingService';
import { paymentService, type PaymentOrderItem, type PaymentShippingData } from '@/services/payment.service';
import { EmailService } from '@/services/EmailService';
import { calculatePixCancelAt } from '@/lib/pix-payment';

export interface CheckoutData {
  // Customer Information
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  document?: string; // CPF/CNPJ

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
    cardToken?: string;
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
  paymentInfo?: {
    id?: string;
    pixCode?: string;
    pixUrl?: string;
    pixExpiration?: string;
    cancelAt?: string;
    boletoUrl?: string;
    isTestMode?: boolean;
    status?: 'pending' | 'approved' | 'failed' | 'expired';
    gatewayErrorMessage?: string;
    regenerationCount?: number;
  };
}

interface ShippingOverride {
  price: number;
  label?: string;
}

const sanitizeDigits = (value?: string) => (value || '').replace(/\D/g, '');

const normalizeCountryCode = (country?: string) =>
  !country || country === 'Brasil' ? 'BR' : country;

const formatDateAsYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildAddressLine = (number?: string, street?: string, neighborhood?: string) =>
  [number, street, neighborhood].filter(Boolean).join(', ');

const buildBillingAddress = (checkoutData: CheckoutData) => {
  if (checkoutData.billingAddress?.address) {
    return {
      line_1: checkoutData.billingAddress.address,
      line_2: checkoutData.billingAddress.complement || '',
      zip_code: sanitizeDigits(checkoutData.billingAddress.zipCode),
      city: checkoutData.billingAddress.city,
      state: checkoutData.billingAddress.state,
      country: normalizeCountryCode(checkoutData.billingAddress.country),
    };
  }

  return {
    line_1: buildAddressLine(checkoutData.number, checkoutData.street, checkoutData.neighborhood),
    line_2: checkoutData.complement || '',
    zip_code: sanitizeDigits(checkoutData.zipCode),
    city: checkoutData.city,
    state: checkoutData.state,
    country: normalizeCountryCode(checkoutData.country),
  };
};

const buildShippingPayload = (
  checkoutData: CheckoutData,
  shippingPrice: number,
  selectedShippingOption: ShippingOption | null,
  hasPhysicalItems: boolean
): PaymentShippingData | undefined => {
  if (!hasPhysicalItems) {
    return undefined;
  }

  const today = new Date();
  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + Math.max(selectedShippingOption?.deliveryTime || 0, 0));
  const maxDate = new Date(estimatedDate);
  maxDate.setDate(estimatedDate.getDate() + 2);

  return {
    amount: Math.round(shippingPrice * 100),
    description: selectedShippingOption?.name || 'Entrega padrão',
    recipient_name: `${checkoutData.firstName} ${checkoutData.lastName}`.trim(),
    recipient_phone: sanitizeDigits(checkoutData.phone),
    address: {
      line_1: buildAddressLine(checkoutData.number, checkoutData.street, checkoutData.neighborhood),
      line_2: checkoutData.complement || '',
      zip_code: sanitizeDigits(checkoutData.zipCode),
      city: checkoutData.city,
      state: checkoutData.state,
      country: normalizeCountryCode(checkoutData.country),
    },
    estimated_delivery_date: formatDateAsYmd(estimatedDate),
    max_delivery_date: formatDateAsYmd(maxDate),
    type: selectedShippingOption?.name || 'Padrão',
  };
};

const buildPaymentItems = (
  items: CartItem[],
  giftWrapPrice: number,
  giftWrapName: string,
  discount: number
): PaymentOrderItem[] => {
  const expandedItems = items.flatMap((item, itemIndex) => {
    const unitAmount = Math.round(item.product.price * 100);

    return Array.from({ length: item.quantity }, (_, quantityIndex) => ({
      description: item.product.name,
      code: item.product.id,
      category: item.product.category?.name || undefined,
      originalAmount: unitAmount,
      sortKey: `${itemIndex}-${quantityIndex}`,
    }));
  });

  if (giftWrapPrice > 0) {
    expandedItems.push({
      description: giftWrapName ? `Embalagem para presente - ${giftWrapName}` : 'Embalagem para presente',
      code: 'gift-wrap',
      category: 'Embalagem',
      originalAmount: Math.round(giftWrapPrice * 100),
      sortKey: 'gift-wrap',
    });
  }

  const targetTotal = Math.max(
    expandedItems.length,
    Math.round(
      items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100 +
      Math.round(giftWrapPrice * 100) -
      Math.round(discount * 100)
    )
  );
  const originalTotal = expandedItems.reduce((sum, item) => sum + item.originalAmount, 0);

  if (expandedItems.length === 0 || originalTotal <= 0) {
    return [];
  }

  let remaining = targetTotal;

  return expandedItems.map((item, index) => {
    const amount =
      index === expandedItems.length - 1
        ? remaining
        : Math.max(1, Math.floor((item.originalAmount / originalTotal) * targetTotal));

    remaining -= amount;

    return {
      amount,
      description: item.description,
      quantity: 1,
      code: item.code,
      category: item.category,
    };
  });
};

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const { user, profile } = useAuth();

  const getShippingQuotes = useCallback(async (items: CartItem[], zipCode: string) => {
    try {
      setLoading(true);
      const shippingItems = items.map(item => ({
        weight: item.product.shipping_info?.weight || 1,
        width: item.product.shipping_info?.width || 20,
        height: item.product.shipping_info?.height || 20,
        length: item.product.shipping_info?.depth || 20,
        quantity: item.quantity,
        price: item.product.price
      }));

      const firstItem = items[0];
      const quotes = await shippingService.calculateShipping(
        zipCode,
        shippingItems,
        firstItem?.product.seller_id
      );

      // Check Product specific shipping options (from the first item as main reference)
      const productShippingOptions = firstItem?.product.shipping_options;

      // Add Seller Delivery option if enabled for this product OR seller profile
      if (firstItem && firstItem.product.seller_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('seller_delivery_enabled')
          .eq('id', firstItem.product.seller_id)
          .single();

        // Check if enabled in Product (new way) or Profile (legacy way)
        const ownDeliveryEnabled = productShippingOptions?.own_delivery || (sellerData as any)?.seller_delivery_enabled;

        if (ownDeliveryEnabled) {
          quotes.push({
            id: 'seller-delivery',
            name: 'Entrega Própria (A combinar)',
            price: 0,
            estimated_delivery: 'Combinar com vendedor',
            deliveryTime: 0,
            company: 'custom'
          });
        }
      }

      setShippingQuotes(quotes);

      // Default select the cheapest option
      if (quotes.length > 0) {
        setSelectedShipping(quotes.reduce((prev, curr) => prev.price < curr.price ? prev : curr));
      } else {
        setSelectedShipping(null);
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
    const sanitizedDocument = data.document?.replace(/\D/g, '') || '';

    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.push('Email válido é obrigatório');
    }

    if (!data.firstName?.trim()) errors.push('Nome é obrigatório');
    if (!data.lastName?.trim()) errors.push('Sobrenome é obrigatório');
    if (!data.phone?.trim()) errors.push('Telefone é obrigatório');
    if (!data.address?.trim()) errors.push('Endereço é obrigatório');
    if (!data.city?.trim()) errors.push('Cidade é obrigatória');
    if (!data.state?.trim()) errors.push('Estado é obrigatório');
    if (!data.zipCode?.trim()) errors.push('CEP é obrigatório');
    if (!data.country?.trim()) errors.push('País é obrigatório');
    if (!data.paymentMethod) errors.push('Método de pagamento é obrigatório');

    if (!sanitizedDocument) errors.push('CPF ou CNPJ Ã© obrigatÃ³rio');
    if (sanitizedDocument && sanitizedDocument.length !== 11 && sanitizedDocument.length !== 14) {
      errors.push('CPF ou CNPJ invÃ¡lido');
    }

    return errors;
  }, []);

  const buildPaymentIdempotencyKey = useCallback((data: CheckoutData) => {
    const attemptId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return `checkout:${data.paymentMethod}:${attemptId}`;
  }, []);

  const processOrder = useCallback(async (
    items: CartItem[],
    checkoutData: CheckoutData,
    shippingOverride?: ShippingOverride
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
      const shipping = shippingOverride?.price ?? selectedShipping?.price ?? 0;

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
      const paymentIdempotencyKey = buildPaymentIdempotencyKey(checkoutData);
      const paymentDescription = `Pedido TheAdoro - ${items.length} item(ns)`;

      // 3. Process Payment
      const customerDocument =
        checkoutData.document ||
        (user?.user_metadata as any)?.cpf ||
        (profile as any)?.document ||
        '';
      const sanitizedCustomerDocument = customerDocument.replace(/\D/g, '');

      if (!sanitizedCustomerDocument) {
        throw new Error('CPF do comprador é obrigatório para gerar o pagamento.');
      }

      if (sanitizedCustomerDocument.length !== 11 && sanitizedCustomerDocument.length !== 14) {
        throw new Error('Informe um CPF ou CNPJ vÃ¡lido para gerar o pagamento.');
      }

      const documentType = sanitizedCustomerDocument.length === 14 ? 'CNPJ' : 'CPF';
      const customerType = sanitizedCustomerDocument.length === 14 ? 'company' : 'individual';
      const merchantOrderCode = `TA-${paymentIdempotencyKey.replace(/[^a-zA-Z0-9]/g, '').slice(-24)}`;
      const billingAddress = buildBillingAddress(checkoutData);
      const hasPhysicalItems = items.some(item => !item.product.is_service);
      const paymentItems = buildPaymentItems(items, giftWrapPrice, giftWrapName, discount);
      const shippingPayload = buildShippingPayload(checkoutData, shipping, selectedShipping, hasPhysicalItems);

      const customerData = {
        name: `${checkoutData.firstName} ${checkoutData.lastName}`.trim(),
        email: checkoutData.email,
        phone: checkoutData.phone,
        document: sanitizedCustomerDocument,
        code: user?.id || sanitizedCustomerDocument,
        type: customerType,
        document_type: documentType,
        metadata: {
          source: 'web_checkout',
          merchant_order_code: merchantOrderCode,
        },
        address: billingAddress
      };

      let paymentResult;
      if (checkoutData.paymentMethod === 'credit_card' || checkoutData.paymentMethod === 'debit_card') {
        if (!checkoutData.paymentDetails?.cardNumber) throw new Error('Dados do cartão incompletos');

        // Tokenize on the client right before submitting the payment.
        // TODO: migrate this direct token API call to the official Pagar.me tokenizecard.js loader.
        const cardToken = checkoutData.paymentDetails?.cardToken;

        if (!cardToken) {
          throw new Error('Não foi possível tokenizar o cartão com o fluxo oficial do Pagar.me.');
        }

        paymentResult = await paymentService.processCard(total, {
          token: cardToken,
          installments: checkoutData.paymentDetails.installments || 1
        }, customerData, {
          idempotencyKey: paymentIdempotencyKey,
          description: paymentDescription,
          orderCode: merchantOrderCode,
          items: paymentItems,
          shipping: shippingPayload,
          billingAddress,
        } as any);
      } else if (checkoutData.paymentMethod === 'pix') {
        paymentResult = await paymentService.generatePix(total, customerData, {
          idempotencyKey: paymentIdempotencyKey,
          description: paymentDescription,
          orderCode: merchantOrderCode,
          items: paymentItems,
          shipping: shippingPayload,
          billingAddress,
        });
      } else {
        // Boleto
        paymentResult = await paymentService.generateBoleto(total, customerData, {
          idempotencyKey: paymentIdempotencyKey,
          description: paymentDescription,
          orderCode: merchantOrderCode,
          items: paymentItems,
          shipping: shippingPayload,
          billingAddress,
        });
      }

      if (paymentResult.status === 'failed') {
        const gatewayErrorMessage = (paymentResult as any).gateway_error_message;
        const friendlyMessage =
          gatewayErrorMessage?.includes('action_forbidden')
            ? 'O gateway recusou a geraÃ§Ã£o do PIX. Verifique se a conta Pagar.me tem PIX habilitado e se o ambiente/credencial estÃ¡ correto.'
            : gatewayErrorMessage
              ? `Pagamento recusado pelo gateway: ${gatewayErrorMessage}`
              : 'Pagamento recusado. Verifique os dados e tente novamente.';

        throw new Error(friendlyMessage);
      }

      const paymentStatus =
        paymentResult.status === 'succeeded'
          ? 'approved'
          : paymentResult.status === 'failed'
            ? 'failed'
            : 'pending';
      const pixCancelAt = calculatePixCancelAt(paymentResult.pix_expiration);

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
          email: checkoutData.email,
          document: sanitizedCustomerDocument,
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
          merchantOrderCode,
          pixCode: paymentResult.pix_code,
          pixUrl: paymentResult.pix_url,
          pixExpiration: paymentResult.pix_expiration,
          cancelAt: pixCancelAt,
          boletoUrl: paymentResult.boleto_url,
          isTestMode: paymentResult.is_test_mode,
          status: paymentStatus,
          gatewayErrorMessage: (paymentResult as any).gateway_error_message || null,
          regenerationCount: 0,
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

      if (shippingOverride?.label) {
        (orderData as any).shipping_method = shippingOverride.label;
      }

      const { data, error: orderError } = await (supabase
        .from('orders')
        .insert(orderData as any) as any)
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

      const paymentMetadata = {
        method: checkoutData.paymentMethod,
        pixCode: paymentResult.pix_code || null,
        pixUrl: paymentResult.pix_url || null,
        pixExpiration: paymentResult.pix_expiration || null,
        cancelAt: pixCancelAt,
        boletoUrl: paymentResult.boleto_url || null,
        isTestMode: paymentResult.is_test_mode || false,
        customerEmail: checkoutData.email,
        gatewayErrorMessage: (paymentResult as any).gateway_error_message || null,
        gatewayResponse: (paymentResult as any).gateway_response || null,
        providerTransactionId: paymentResult.id,
        regenerationCount: 0,
      };

      let paymentRow: any = null;
      const { data: insertedPaymentRow, error: paymentPersistenceError } = await (supabase
        .from('payments' as any)
        .insert({
          order_id: data.id,
          provider: 'pagarme',
          provider_transaction_id: paymentResult.id,
          idempotency_key: paymentIdempotencyKey,
          amount: total,
          status: paymentStatus,
          metadata: paymentMetadata,
        })
        .select()
        .single() as any);

      if (paymentPersistenceError?.code === '23505' && paymentResult.id) {
        const { data: existingPaymentRow, error: existingPaymentLookupError } = await (supabase
          .from('payments' as any)
          .select('*')
          .eq('provider', 'pagarme')
          .eq('provider_transaction_id', paymentResult.id)
          .maybeSingle() as any);

        if (existingPaymentLookupError) {
          console.error('Existing payment lookup FAILED:', existingPaymentLookupError);
        } else {
          paymentRow = existingPaymentRow;
        }
      } else if (paymentPersistenceError) {
        console.error('Payment persistence FAILED:', paymentPersistenceError);
      } else {
        paymentRow = insertedPaymentRow;
      }

      if (paymentRow) {
        const { error: paymentEventError } = await supabase
          .from('payment_events' as any)
          .insert({
            payment_id: paymentRow.id,
            order_id: data.id,
            provider: 'pagarme',
            event_type: 'checkout_payment_created',
            payload: {
              paymentResult,
              checkoutPaymentMethod: checkoutData.paymentMethod,
            },
            processed_at: new Date().toISOString(),
          } as any);

        if (paymentEventError) {
          console.error('Payment event persistence FAILED:', paymentEventError);
        }
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
          } as any);
          if (apptError) console.error('Error creating automatic appointment:', apptError);
        }
      }

      // 7. Update Stock (Only for physical products)
      for (const item of items) {
        if (!item.product.is_service && item.product.stock_quantity !== null && item.product.stock_quantity !== undefined) {
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
        paymentInfo: {
          id: paymentResult.id,
          pixCode: paymentResult.pix_code,
          pixUrl: paymentResult.pix_url,
          pixExpiration: paymentResult.pix_expiration,
          cancelAt: pixCancelAt,
          boletoUrl: paymentResult.boleto_url,
          isTestMode: paymentResult.is_test_mode,
          status: paymentStatus,
          gatewayErrorMessage: (paymentResult as any).gateway_error_message || null,
          regenerationCount: 0,
        }
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
  }, [user, selectedShipping, calculateTax, validateCheckoutData, buildPaymentIdempotencyKey]);

  const getOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          payments (*),
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
      const latestPayment = [ ...((data as any).payments || []) ]
        .sort((left: any, right: any) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime())[0];
      const latestPaymentMetadata = latestPayment?.metadata || {};

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
        delivery_schedule: notesData.deliverySchedule,
        paymentInfo: notesData.paymentInfo
          ? {
              ...notesData.paymentInfo,
              id:
                latestPaymentMetadata.providerTransactionId ||
                latestPayment?.provider_transaction_id ||
                notesData.paymentInfo.id,
              pixCode: latestPaymentMetadata.pixCode || notesData.paymentInfo.pixCode,
              pixUrl: latestPaymentMetadata.pixUrl || notesData.paymentInfo.pixUrl,
              pixExpiration: latestPaymentMetadata.pixExpiration || notesData.paymentInfo.pixExpiration,
              cancelAt:
                latestPaymentMetadata.cancelAt ||
                notesData.paymentInfo.cancelAt ||
                calculatePixCancelAt(
                  latestPaymentMetadata.pixExpiration || notesData.paymentInfo.pixExpiration
                ),
              status:
                notesData.paymentInfo.status === 'expired'
                  ? 'expired'
                  : latestPayment?.status || notesData.paymentInfo.status,
              regenerationCount:
                latestPaymentMetadata.regenerationCount ??
                notesData.paymentInfo.regenerationCount ??
                0,
              gatewayErrorMessage:
                latestPaymentMetadata.gatewayErrorMessage ||
                latestPaymentMetadata.gatewayResponse?.charges?.[0]?.last_transaction?.gateway_response?.errors?.[0]?.message ||
                notesData.paymentInfo.gatewayErrorMessage
            }
          : undefined
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
