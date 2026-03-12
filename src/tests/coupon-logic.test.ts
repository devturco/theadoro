
import { describe, it, expect } from 'vitest';

interface Coupon {
    code: string;
    seller_id: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase_value: number;
    expires_at?: Date;
    is_active: boolean;
}

const calculateDiscount = (subtotal: number, coupon: Coupon, itemSellerId: string) => {
    if (!coupon.is_active) return 0;
    if (coupon.expires_at && coupon.expires_at < new Date()) return 0;
    if (subtotal < coupon.min_purchase_value) return 0;
    
    // If it's a seller coupon, check if it matches the item's seller
    if (coupon.seller_id && coupon.seller_id !== itemSellerId) return 0;

    if (coupon.discount_type === 'percentage') {
        return (subtotal * coupon.discount_value) / 100;
    }
    return Math.min(coupon.discount_value, subtotal);
};

describe('Coupon Logic', () => {
    const sellerA = 'seller-123';
    const sellerB = 'seller-456';

    const percentageCoupon: Coupon = {
        code: 'PROMO10',
        seller_id: sellerA,
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_value: 50,
        is_active: true
    };

    it('should apply 10% discount for matching seller and valid subtotal', () => {
        const discount = calculateDiscount(100, percentageCoupon, sellerA);
        expect(discount).toBe(10);
    });

    it('should NOT apply discount if seller does not match', () => {
        const discount = calculateDiscount(100, percentageCoupon, sellerB);
        expect(discount).toBe(0);
    });

    it('should NOT apply discount if subtotal is below minimum', () => {
        const discount = calculateDiscount(40, percentageCoupon, sellerA);
        expect(discount).toBe(0);
    });

    it('should NOT apply discount if coupon is inactive', () => {
        const inactiveCoupon = { ...percentageCoupon, is_active: false };
        const discount = calculateDiscount(100, inactiveCoupon, sellerA);
        expect(discount).toBe(0);
    });
});
