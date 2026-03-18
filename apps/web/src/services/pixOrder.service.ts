import { supabase } from '@/integrations/supabase/client';
import { paymentService, type CustomerData, type PaymentIntent } from './payment.service';
import {
  calculatePixCancelAt,
  getPixLifecycleState,
} from '@/lib/pix-payment';

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (!value) return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  if (typeof value === 'object') {
    return value as T;
  }

  return fallback;
};

const getLatestPaymentRow = (payments: any[] = []) =>
  [...payments].sort((left, right) => {
    const leftTime = new Date(left?.created_at || 0).getTime();
    const rightTime = new Date(right?.created_at || 0).getTime();
    return rightTime - leftTime;
  })[0] || null;

const buildPaymentInfo = (order: any) => {
  const notes = parseJson<Record<string, any>>(order.notes, {});
  const latestPaymentRow = getLatestPaymentRow(order.payments);
  const metadata = latestPaymentRow?.metadata || {};
  const storedPaymentInfo = notes.paymentInfo || {};
  const pixExpiration = metadata.pixExpiration || storedPaymentInfo.pixExpiration || null;
  const cancelAt =
    metadata.cancelAt ||
    storedPaymentInfo.cancelAt ||
    calculatePixCancelAt(pixExpiration);

  return {
    ...storedPaymentInfo,
    id: metadata.providerTransactionId || latestPaymentRow?.provider_transaction_id || storedPaymentInfo.id || null,
    pixCode: metadata.pixCode || storedPaymentInfo.pixCode || null,
    pixUrl: metadata.pixUrl || storedPaymentInfo.pixUrl || null,
    pixExpiration,
    cancelAt,
    boletoUrl: metadata.boletoUrl || storedPaymentInfo.boletoUrl || null,
    isTestMode: metadata.isTestMode ?? storedPaymentInfo.isTestMode ?? false,
    status: storedPaymentInfo.status || latestPaymentRow?.status || 'pending',
    gatewayErrorMessage:
      metadata.gatewayErrorMessage ||
      storedPaymentInfo.gatewayErrorMessage ||
      null,
    regenerationCount:
      storedPaymentInfo.regenerationCount ||
      metadata.regenerationCount ||
      0,
  };
};

const fetchOrderForPix = async (orderId: string) => {
  const { data, error } = await (supabase
    .from('orders')
    .select(`
      id,
      buyer_id,
      total_amount,
      payment_method,
      status,
      notes,
      shipping_address,
      payments (
        id,
        provider,
        provider_transaction_id,
        idempotency_key,
        amount,
        status,
        metadata,
        created_at
      )
    `)
    .eq('id', orderId)
    .single() as any);

  if (error) {
    throw error;
  }

  return data;
};

const buildCustomerFromOrder = async (order: any): Promise<CustomerData> => {
  const notes = parseJson<Record<string, any>>(order.notes, {});
  const shippingAddress = parseJson<Record<string, any>>(order.shipping_address, {});
  const { data: authData } = await supabase.auth.getUser();

  const firstName = notes.customer?.firstName || '';
  const lastName = notes.customer?.lastName || '';
  const name = `${firstName} ${lastName}`.trim();
  const document =
    notes.customer?.document ||
    authData.user?.user_metadata?.cpf ||
    authData.user?.user_metadata?.document ||
    '';

  const sanitizedDocument = String(document).replace(/\D/g, '');

  if (!name) {
    throw new Error('Não foi possível identificar o nome do comprador para gerar um novo PIX.');
  }

  if (!notes.customer?.email) {
    throw new Error('Não foi possível identificar o e-mail do comprador para gerar um novo PIX.');
  }

  if (!notes.customer?.phone) {
    throw new Error('Não foi possível identificar o WhatsApp do comprador para gerar um novo PIX.');
  }

  if (!sanitizedDocument) {
    throw new Error('Não foi possível identificar o CPF/CNPJ do comprador para gerar um novo PIX.');
  }

  return {
    name,
    email: notes.customer.email,
    phone: notes.customer.phone,
    document: sanitizedDocument,
    address: {
      line_1: [shippingAddress.number, shippingAddress.street, shippingAddress.neighborhood]
        .filter(Boolean)
        .join(', '),
      line_2: shippingAddress.complement || '',
      zip_code: String(shippingAddress.zipCode || shippingAddress.zip_code || '').replace(/\D/g, ''),
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      country:
        shippingAddress.country === 'Brasil' || !shippingAddress.country
          ? 'BR'
          : shippingAddress.country,
    },
  };
};

const buildPaymentMetadata = (
  paymentResult: PaymentIntent,
  regenerationCount: number
) => {
  const cancelAt = calculatePixCancelAt(paymentResult.pix_expiration);

  return {
    method: 'pix',
    pixCode: paymentResult.pix_code || null,
    pixUrl: paymentResult.pix_url || null,
    pixExpiration: paymentResult.pix_expiration || null,
    cancelAt,
    boletoUrl: paymentResult.boleto_url || null,
    isTestMode: paymentResult.is_test_mode || false,
    gatewayErrorMessage: paymentResult.gateway_error_message || null,
    gatewayResponse: (paymentResult as any).gateway_response || null,
    providerTransactionId: paymentResult.id,
    regenerationCount,
  };
};

export const cancelExpiredPixOrder = async (orderId: string) => {
  const order = await fetchOrderForPix(orderId);

  if (order.payment_method !== 'pix' || order.status !== 'pending') {
    return { cancelled: false, order };
  }

  const notes = parseJson<Record<string, any>>(order.notes, {});
  const paymentInfo = buildPaymentInfo(order);
  const lifecycle = getPixLifecycleState(paymentInfo);

  if (!lifecycle.isCancellationDue) {
    return { cancelled: false, order };
  }

  const latestPaymentRow = getLatestPaymentRow(order.payments);
  const nowIso = new Date().toISOString();
  const nextNotes = {
    ...notes,
    paymentInfo: {
      ...paymentInfo,
      status: 'expired',
      cancelAt: lifecycle.cancelAt,
      expiredAt: nowIso,
      gatewayErrorMessage: 'O prazo do PIX terminou e o pedido foi cancelado automaticamente.',
    },
  };

  const remoteProviderTransactionId =
    latestPaymentRow?.provider_transaction_id ||
    latestPaymentRow?.metadata?.providerTransactionId ||
    paymentInfo.id;

  if (remoteProviderTransactionId) {
    try {
      await paymentService.cancelRemoteOrder(remoteProviderTransactionId);
    } catch (remoteCancelError) {
      console.error('Erro ao cancelar pedido no Pagar.me:', remoteCancelError);
    }
  }

  const { error: updateError } = await (supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: JSON.stringify(nextNotes),
    } as any)
    .eq('id', orderId) as any);

  if (updateError) {
    throw updateError;
  }

  if (latestPaymentRow?.id) {
    const { error: eventError } = await supabase
      .from('payment_events' as any)
      .insert({
        payment_id: latestPaymentRow.id,
        order_id: orderId,
        provider: latestPaymentRow.provider || 'pagarme',
        event_type: 'pix_payment_expired',
        payload: {
          cancelAt: lifecycle.cancelAt,
          pixExpiration: paymentInfo.pixExpiration || null,
          cancelledAt: nowIso,
        },
        processed_at: nowIso,
      } as any);

    if (eventError) {
      console.error('Erro ao registrar expiracao do PIX:', eventError);
    }
  }

  const refreshedOrder = await fetchOrderForPix(orderId);
  return { cancelled: true, order: refreshedOrder };
};

export const regeneratePixForOrder = async (orderId: string) => {
  const order = await fetchOrderForPix(orderId);

  if (order.payment_method !== 'pix') {
    throw new Error('Este pedido não utiliza PIX.');
  }

  if (order.status !== 'pending') {
    throw new Error('Só é possível gerar um novo PIX para pedidos pendentes.');
  }

  const notes = parseJson<Record<string, any>>(order.notes, {});
  const currentPaymentInfo = buildPaymentInfo(order);
  const lifecycle = getPixLifecycleState(currentPaymentInfo);

  if (lifecycle.isCancellationDue) {
    await cancelExpiredPixOrder(orderId);
    throw new Error('O prazo para este pedido terminou. O pedido foi cancelado automaticamente.');
  }

  if (!lifecycle.isExpired) {
    throw new Error('O PIX atual ainda está válido. Aguarde a expiração para gerar um novo código.');
  }

  const customer = await buildCustomerFromOrder(order);
  const nextRegenerationCount = Number(currentPaymentInfo.regenerationCount || 0) + 1;
  const idempotencyKey =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `pix-regeneration:${orderId}:${crypto.randomUUID()}`
      : `pix-regeneration:${orderId}:${Date.now()}`;

  const paymentResult = await paymentService.generatePix(order.total_amount, customer, {
    orderId,
    idempotencyKey,
    description: `Pedido TheAdoro - PIX regenerado`,
  });

  if (paymentResult.status === 'failed') {
    throw new Error(
      paymentResult.gateway_error_message ||
        'O gateway recusou a geração do novo PIX.'
    );
  }

  const paymentMetadata = buildPaymentMetadata(paymentResult, nextRegenerationCount);

  const { data: paymentRow, error: paymentError } = await (supabase
    .from('payments' as any)
    .insert({
      order_id: orderId,
      provider: 'pagarme',
      provider_transaction_id: paymentResult.id,
      idempotency_key: idempotencyKey,
      amount: order.total_amount,
      status: 'pending',
      metadata: paymentMetadata,
    })
    .select()
    .single() as any);

  if (paymentError) {
    throw paymentError;
  }

  const nextNotes = {
    ...notes,
    customer: {
      ...notes.customer,
      document: customer.document,
    },
    paymentInfo: {
      id: paymentResult.id,
      pixCode: paymentResult.pix_code || null,
      pixUrl: paymentResult.pix_url || null,
      pixExpiration: paymentResult.pix_expiration || null,
      cancelAt: paymentMetadata.cancelAt,
      boletoUrl: paymentResult.boleto_url || null,
      isTestMode: paymentResult.is_test_mode || false,
      status: 'pending',
      gatewayErrorMessage: paymentResult.gateway_error_message || null,
      regenerationCount: nextRegenerationCount,
    },
  };

  const { error: orderUpdateError } = await (supabase
    .from('orders')
    .update({
      notes: JSON.stringify(nextNotes),
    } as any)
    .eq('id', orderId) as any);

  if (orderUpdateError) {
    throw orderUpdateError;
  }

  const { error: eventError } = await supabase
    .from('payment_events' as any)
    .insert({
      payment_id: paymentRow.id,
      order_id: orderId,
      provider: 'pagarme',
      event_type: 'pix_regenerated',
      payload: {
        paymentResult,
        regenerationCount: nextRegenerationCount,
      },
      processed_at: new Date().toISOString(),
    } as any);

  if (eventError) {
    console.error('Erro ao registrar regeneracao do PIX:', eventError);
  }

  const refreshedOrder = await fetchOrderForPix(orderId);
  return {
    order: refreshedOrder,
    paymentInfo: nextNotes.paymentInfo,
  };
};
