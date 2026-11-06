/**
 * Chaves de storage do carrinho e limpeza por usuário.
 *
 * Fica fora dos contextos para poder ser testado sem React, Supabase ou
 * localStorage de verdade (os testes passam um `Storage` qualquer).
 */

/** Prefixo comum a todo carrinho (convidado e logado). */
export const CART_KEY_PREFIX = 'theadoro-cart';

/** Chave do carrinho: uma por usuário, para não vazar itens entre contas. */
export const getCartKey = (userId?: string | null): string =>
  userId ? `${CART_KEY_PREFIX}-${userId}` : `${CART_KEY_PREFIX}-guest`;

/** Chaves que sobrevivem ao logout (preferências globais). */
const PERSISTENT_KEYS = new Set(['theme', 'vite-ui-theme']);

/**
 * Remove do storage tudo que é do usuário: carrinho, chaves do Supabase e
 * dados de checkout. Preferências globais ficam.
 */
export const clearUserStorage = (storage: Storage): void => {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }

  keys.forEach((key) => {
    if (PERSISTENT_KEYS.has(key)) return;

    if (
      key === 'auth_db_roles' ||
      key === 'checkoutFormData' ||
      key === 'checkoutStep' ||
      key.includes('supabase.auth.token') ||
      key.startsWith('sb-') ||
      key.startsWith(`${CART_KEY_PREFIX}-`)
    ) {
      storage.removeItem(key);
    }
  });
};