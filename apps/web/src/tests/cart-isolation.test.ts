
import { describe, it, expect } from 'vitest';

// Simulating the Cart Storage logic
const getCartKey = (userId?: string) => {
    // Current bug: maybe it returns a static key
    return 'theadoro-cart';
};

describe('Cart Isolation', () => {
    it('should have different storage keys for different users', () => {
        const userA = 'user-aaa';
        const userB = 'user-bbb';
        
        const keyA = getCartKey(userA);
        const keyB = getCartKey(userB);
        
        // This will FAIL now because both return 'theadoro-cart'
        expect(keyA).not.toBe(keyB);
    });

    it('should return a guest key for unauthenticated users', () => {
        expect(getCartKey()).toBe('theadoro-cart-guest');
    });
});
