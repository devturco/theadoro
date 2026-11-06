import { describe, it, expect, beforeEach } from 'vitest';
import { clearUserStorage, getCartKey } from '@/lib/cartStorage';

// Storage em memória — mesmo contrato do localStorage.
const createStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  } as Storage;
};

describe('Auth State Cleanup', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createStorage();
  });

  it('removes the user cart, auth roles and checkout data on logout', () => {
    storage.setItem(getCartKey('user-123'), JSON.stringify({ items: [{ id: '1' }] }));
    storage.setItem(getCartKey(), JSON.stringify({ items: [{ id: '2' }] }));
    storage.setItem('auth_db_roles', JSON.stringify(['seller']));
    storage.setItem('checkoutFormData', '{}');
    storage.setItem('sb-abcdef-auth-token', 'token');

    clearUserStorage(storage);

    expect(storage.getItem(getCartKey('user-123'))).toBeNull();
    expect(storage.getItem(getCartKey())).toBeNull();
    expect(storage.getItem('auth_db_roles')).toBeNull();
    expect(storage.getItem('checkoutFormData')).toBeNull();
    expect(storage.getItem('sb-abcdef-auth-token')).toBeNull();
  });

  it('keeps global preferences after logout', () => {
    storage.setItem('theme', 'dark');
    storage.setItem(getCartKey('user-123'), '{}');

    clearUserStorage(storage);

    expect(storage.getItem('theme')).toBe('dark');
  });
});
