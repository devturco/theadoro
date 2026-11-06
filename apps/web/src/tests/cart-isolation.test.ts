import { describe, it, expect } from 'vitest';
import { getCartKey, CART_KEY_PREFIX } from '@/lib/cartStorage';

describe('Cart Isolation', () => {
    it('should give each user their own storage key', () => {
        const keyA = getCartKey('user-aaa');
        const keyB = getCartKey('user-bbb');

        expect(keyA).toBe(`${CART_KEY_PREFIX}-user-aaa`);
        expect(keyB).toBe(`${CART_KEY_PREFIX}-user-bbb`);
        expect(keyA).not.toBe(keyB);
    });

    it('should return a guest key for unauthenticated users', () => {
        expect(getCartKey()).toBe(`${CART_KEY_PREFIX}-guest`);
        expect(getCartKey(null)).toBe(`${CART_KEY_PREFIX}-guest`);
    });
});
