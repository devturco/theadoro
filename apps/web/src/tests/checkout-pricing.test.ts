import { describe, it, expect } from 'vitest';
import {
  calculateOrderTotals,
  calculatePaymentMethodDiscount,
  validateCoupon,
  type CouponSnapshot,
} from '@/lib/checkout-pricing';

const percentageCoupon: CouponSnapshot = {
  id: 'coupon-1',
  code: 'PROMO10',
  discount_type: 'percentage',
  discount_value: 10,
  min_purchase_value: 50,
  is_active: true,
};

describe('calculatePaymentMethodDiscount', () => {
  it('aplica 5% no PIX sobre subtotal + frete + embalagem', () => {
    expect(calculatePaymentMethodDiscount(100, 20, 10, 'pix')).toBe(6.5);
  });

  it('aplica 3% no boleto', () => {
    expect(calculatePaymentMethodDiscount(100, 0, 0, 'boleto')).toBe(3);
  });

  it('não aplica desconto no cartão', () => {
    expect(calculatePaymentMethodDiscount(100, 20, 10, 'credit_card')).toBe(0);
  });
});

describe('validateCoupon', () => {
  it('aceita cupom percentual dentro das regras', () => {
    const result = validateCoupon(percentageCoupon, 100);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(10);
  });

  it('recusa cupom abaixo do mínimo', () => {
    const result = validateCoupon(percentageCoupon, 40);
    expect(result.ok).toBe(false);
    expect(result.discount).toBe(0);
  });

  it('recusa cupom expirado (coluna nova e legada)', () => {
    expect(
      validateCoupon(
        { ...percentageCoupon, expires_at: '2020-01-01T00:00:00Z' },
        100
      ).ok
    ).toBe(false);

    expect(
      validateCoupon(
        { ...percentageCoupon, expiration_date: '2020-01-01T00:00:00Z' },
        100
      ).ok
    ).toBe(false);
  });

  it('recusa cupom no limite de usos', () => {
    const result = validateCoupon(
      { ...percentageCoupon, usage_limit: 5, used_count: 5 },
      100
    );
    expect(result.ok).toBe(false);
  });

  it('recusa cupom de vendedor quando o carrinho tem outro vendedor', () => {
    const result = validateCoupon(
      { ...percentageCoupon, seller_id: 'seller-a' },
      100,
      ['seller-b']
    );
    expect(result.ok).toBe(false);
  });

  it('aceita cupom de vendedor quando todos os itens são dele', () => {
    const result = validateCoupon(
      { ...percentageCoupon, seller_id: 'seller-a' },
      100,
      ['seller-a']
    );
    expect(result.ok).toBe(true);
  });

  it('respeita o teto de desconto', () => {
    const result = validateCoupon(
      { ...percentageCoupon, max_discount_value: 15 },
      1000
    );
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(15);
  });

  it('não deixa o desconto fixo passar do subtotal', () => {
    const result = validateCoupon(
      {
        code: 'FIXO',
        discount_type: 'fixed',
        discount_value: 500,
        is_active: true,
      },
      100
    );
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(100);
  });
});

describe('calculateOrderTotals', () => {
  it('soma cupom e desconto de PIX no total', () => {
    const totals = calculateOrderTotals({
      subtotal: 100,
      shipping: 20,
      giftWrap: 10,
      paymentMethod: 'pix',
      coupon: percentageCoupon,
    });

    expect(totals.paymentDiscount).toBe(6.5);
    expect(totals.couponDiscount).toBe(10);
    expect(totals.discount).toBe(16.5);
    expect(totals.total).toBe(113.5);
  });

  it('ignora cupom inválido em vez de aplicar desconto fantasma', () => {
    const totals = calculateOrderTotals({
      subtotal: 10,
      shipping: 0,
      giftWrap: 0,
      paymentMethod: 'credit_card',
      coupon: percentageCoupon,
    });

    expect(totals.couponDiscount).toBe(0);
    expect(totals.total).toBe(10);
  });

  it('nunca devolve total negativo', () => {
    const totals = calculateOrderTotals({
      subtotal: 10,
      shipping: 0,
      giftWrap: 0,
      paymentMethod: 'pix',
      coupon: {
        code: 'TUDO',
        discount_type: 'fixed',
        discount_value: 999,
        is_active: true,
      },
    });

    expect(totals.total).toBe(0);
  });
});