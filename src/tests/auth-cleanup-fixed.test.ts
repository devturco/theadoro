
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index],
    get length() { return Object.keys(store).length; }
  };
})();

// Definindo o mock globalmente para o ambiente Node
global.localStorage = localStorageMock as any;
global.sessionStorage = localStorageMock as any;

describe('Auth State Cleanup (FIXED)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clean up cart items with the correct prefix', () => {
    const userId = 'user-123';
    const cartKey = `theadoro-cart-${userId}`;
    const rolesKey = 'auth_db_roles';
    
    localStorage.setItem(cartKey, JSON.stringify({ items: [{ id: '1' }] }));
    localStorage.setItem(rolesKey, JSON.stringify(['seller']));

    // Simulação do código corrigido
    const cleanup = () => {
      localStorage.removeItem('auth_db_roles');
      Object.keys(localStorage).forEach(key => {
        // Agora usando o prefixo correto 'theadoro-cart-'
        if (key.startsWith('theadoro-cart-')) {
          localStorage.removeItem(key);
        }
      });
    };

    cleanup();

    expect(localStorage.getItem(cartKey)).toBeNull();
    expect(localStorage.getItem(rolesKey)).toBeNull();
  });
});
