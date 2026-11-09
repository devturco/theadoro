/**
 * Regras de preço do checkout.
 *
 * Ficam aqui (e não espalhadas entre a página e o hook) porque os mesmos
 * números precisam aparecer na tela **e** ser enviados ao gateway. Quando as
 * duas cópias divergem, o cliente vê um valor e paga outro.
 */

export type CheckoutPaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'boleto';

export interface CouponSnapshot {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  /** Coluna nova usada pelo checkout. */
  min_purchase_value?: number | null;
  /** Coluna legada, ainda presente em algumas instalações. */
  min_purchase?: number | null;
  max_discount_value?: number | null;
  usage_limit?: number | null;
  used_count?: number | null;
  /** Coluna nova. */
  expires_at?: string | null;
  /** Coluna legada. */
  expiration_date?: string | null;
  is_active?: boolean | null;
  seller_id?: string | null;
}

export interface CouponValidation {
  ok: boolean;
  reason?: string;
  discount: number;
}

export interface OrderTotalsInput {
  subtotal: number;
  shipping: number;
  giftWrap?: number;
  paymentMethod: CheckoutPaymentMethod;
  coupon?: CouponSnapshot | null;
  sellerIds?: string[];
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  giftWrap: number;
  paymentDiscount: number;
  couponDiscount: number;
  discount: number;
  total: number;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const couponMinPurchase = (coupon: CouponSnapshot) =>
  Number(coupon.min_purchase_value ?? coupon.min_purchase ?? 0) || 0;

const couponExpiration = (coupon: CouponSnapshot) =>
  coupon.expires_at || coupon.expiration_date || null;

/** Desconto por forma de pagamento (mesma regra do gateway). */
export const paymentMethodDiscountRate = (
  method: CheckoutPaymentMethod
): number => {
  if (method === 'pix') return 0.05;
  if (method === 'boleto') return 0.03;
  return 0;
};

export const calculatePaymentMethodDiscount = (
  subtotal: number,
  shipping: number,
  giftWrap: number,
  method: CheckoutPaymentMethod
): number =>
  roundMoney(
    Math.max(0, subtotal + shipping + giftWrap) *
      paymentMethodDiscountRate(method)
  );

/**
 * Valida e calcula o cupom. Retorna sempre o motivo legível quando não vale,
 * para a tela conseguir explicar ao comprador.
 */
export const validateCoupon = (
  coupon: CouponSnapshot | null | undefined,
  subtotal: number,
  sellerIds: string[] = []
): CouponValidation => {
  if (!coupon) {
    return { ok: false, reason: 'Cupom não informado.', discount: 0 };
  }

  if (coupon.is_active === false) {
    return { ok: false, reason: 'Este cupom está inativo.', discount: 0 };
  }

  const expiration = couponExpiration(coupon);
  if (expiration) {
    const expiresAt = new Date(expiration).getTime();
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      return { ok: false, reason: 'Este cupom expirou.', discount: 0 };
    }
  }

  const minimum = couponMinPurchase(coupon);
  if (subtotal < minimum) {
    return {
      ok: false,
      reason: `Este cupom vale para compras a partir de R$ ${minimum.toFixed(2)}.`,
      discount: 0,
    };
  }

  const usageLimit = Number(coupon.usage_limit);
  const usedCount = Number(coupon.used_count || 0);
  if (Number.isFinite(usageLimit) && usageLimit > 0 && usedCount >= usageLimit) {
    return { ok: false, reason: 'Este cupom atingiu o limite de usos.', discount: 0 };
  }

  if (coupon.seller_id) {
    if (sellerIds.length === 0 || sellerIds.some((id) => id !== coupon.seller_id)) {
      return {
        ok: false,
        reason: 'Este cupom vale apenas para produtos do vendedor que o criou.',
        discount: 0,
      };
    }
  }

  const value = Number(coupon.discount_value) || 0;
  if (value <= 0) {
    return { ok: false, reason: 'Cupom sem valor de desconto.', discount: 0 };
  }

  let discount =
    coupon.discount_type === 'percentage'
      ? (subtotal * value) / 100
      : Math.min(value, subtotal);

  const maxDiscount = Number(coupon.max_discount_value);
  if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
    discount = Math.min(discount, maxDiscount);
  }

  return { ok: true, discount: roundMoney(Math.max(0, discount)) };
};

/**
 * Fonte única do total: a tela e o pagamento usam esta função.
 */
export const calculateOrderTotals = ({
  subtotal,
  shipping,
  giftWrap = 0,
  paymentMethod,
  coupon,
  sellerIds = [],
}: OrderTotalsInput): OrderTotals => {
  const safeSubtotal = roundMoney(Math.max(0, subtotal));
  const safeShipping = roundMoney(Math.max(0, shipping));
  const safeGiftWrap = roundMoney(Math.max(0, giftWrap));

  const paymentDiscount = calculatePaymentMethodDiscount(
    safeSubtotal,
    safeShipping,
    safeGiftWrap,
    paymentMethod
  );

  const couponValidation = validateCoupon(coupon, safeSubtotal, sellerIds);
  const couponDiscount = couponValidation.ok ? couponValidation.discount : 0;

  const discount = roundMoney(paymentDiscount + couponDiscount);
  const total = roundMoney(
    Math.max(0, safeSubtotal + safeShipping + safeGiftWrap - discount)
  );

  return {
    subtotal: safeSubtotal,
    shipping: safeShipping,
    giftWrap: safeGiftWrap,
    paymentDiscount,
    couponDiscount,
    discount,
    total,
  };
};