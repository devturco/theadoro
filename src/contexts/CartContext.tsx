import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';

// Interfaces
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  serviceDate?: string;
  serviceTime?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number, options?: Record<string, string>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  cartCount: number;
  cartTotal: number;
}

// Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; options?: Record<string, string> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Reducer
const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity, options } = action.payload;
      const existingItemIndex = state.findIndex(
        item => item.product.id === product.id && 
        JSON.stringify(item.selectedOptions) === JSON.stringify(options)
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        return state.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          selectedOptions: options,
        };
        return [...state, newItem];
      }
    }

    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.payload);

    case 'UPDATE_QUANTITY':
      return state.map(item =>
        item.id === action.payload.itemId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);

    case 'CLEAR_CART':
      return [];

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

// Helper functions
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
};

const calculateShipping = (subtotal: number): number => {
  // Free shipping for orders over R$ 100
  return subtotal >= 100 ? 0 : 15;
};

const calculateTotal = (subtotal: number, shipping: number, discount: number): number => {
  return subtotal + shipping - discount;
};

// Context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('theadoro-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('theadoro-cart', JSON.stringify(items));
  }, [items]);

  // Calculate cart totals
  const subtotal = calculateSubtotal(items);
  const shipping = calculateShipping(subtotal);
  const discount = 0; // TODO: Implement discount logic
  const total = calculateTotal(subtotal, shipping, discount);

  const cart: Cart = {
    items,
    subtotal,
    shipping,
    discount,
    total,
  };

  const addToCart = (product: Product, quantity = 1, options?: Record<string, string>) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, options } });
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    const item = items.find(item => item.id === itemId);
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    if (item) {
      toast({
        title: "Produto removido",
        description: `${item.product.name} foi removido do carrinho.`,
      });
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho.",
    });
  };

  const isInCart = (productId: string): boolean => {
    return items.some(item => item.product.id === productId);
  };

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = total;

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    cartCount,
    cartTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};