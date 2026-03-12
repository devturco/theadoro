
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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth State Cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should have incorrect cleanup logic currently (This test confirms the bug)', () => {
    const userId = 'user-123';
    const cartKey = `theadoro-cart-${userId}`;
    const rolesKey = 'auth_db_roles';
    
    localStorage.setItem(cartKey, JSON.stringify({ items: [{ id: '1' }] }));
    localStorage.setItem(rolesKey, JSON.stringify(['seller']));

    // Simulação simplificada do que está no AuthContext.tsx hoje
    const cleanup = () => {
      localStorage.removeItem('auth_db_roles');
      Object.keys(localStorage).forEach(key => {
        // O bug está aqui: 'theadoro-cart-user-' vs 'theadoro-cart-'
        if (key.startsWith('theadoro-cart-user-')) {
          localStorage.removeItem(key);
        }
      });
    };

    cleanup();

    // Verificação que prova que o carrinho AINDA EXISTE
    expect(localStorage.getItem(cartKey)).not.toBeNull();
    expect(localStorage.getItem(rolesKey)).toBeNull();
  });
});
