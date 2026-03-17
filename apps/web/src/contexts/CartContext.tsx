import React, { createContext, useContext, useReducer, useEffect, useMemo, useState } from 'react';
import { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  FreeShippingRule,
  getAppliedFreeShippingRule,
  getCampaignFreeShippingRules,
  getProductFreeShippingRules,
} from '@/lib/freeShipping';

// Interfaces
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  serviceDate?: string;
  serviceTime?: string;
  variant?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  isFreeShippingApplied: boolean;
  freeShippingRule: FreeShippingRule | null;
  selectedShipping?: {
    id: string;
    name: string;
    price: number;
    deliveryTime: number;
  };
}

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number, options?: Record<string, string>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setShipping: (shipping: Cart['selectedShipping']) => void;
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
  | { type: 'SET_SHIPPING'; payload: Cart['selectedShipping'] }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[], shipping?: Cart['selectedShipping'] } };

// Reducer
const cartReducer = (state: { items: CartItem[], selectedShipping?: Cart['selectedShipping'] }, action: CartAction): { items: CartItem[], selectedShipping?: Cart['selectedShipping'] } => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity, options } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === product.id &&
          JSON.stringify(item.selectedOptions) === JSON.stringify(options)
      );

      if (existingItemIndex > -1) {
        return {
          ...state,
          items: state.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          selectedOptions: options,
        };
        return { ...state, items: [...state.items, newItem] };
      }
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'SET_SHIPPING':
      return { ...state, selectedShipping: action.payload };

    case 'CLEAR_CART':
      return { items: [], selectedShipping: undefined };

    case 'LOAD_CART':
      return { items: action.payload.items, selectedShipping: action.payload.shipping };

    default:
      return state;
  }
};

// Helper functions
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + ((item.product.price || 0) * item.quantity), 0);
};

const calculateBaseShipping = (items: CartItem[]): number => {
  return items.length > 0 ? 15 : 0;
};

const calculateTotal = (subtotal: number, shipping: number, discount: number): number => {
  return subtotal + shipping - discount;
};

// Context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [campaignRules, setCampaignRules] = useState<FreeShippingRule[]>([]);

  const cartKey = useMemo(() => {
    return user ? `theadoro-cart-${user.id}` : 'theadoro-cart-guest';
  }, [user]);

  // Load cart from localStorage whenever the user (and thus cartKey) changes
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: { 
          items: parsed.items || [], 
          shipping: parsed.selectedShipping 
        }});
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        dispatch({ type: 'LOAD_CART', payload: { items: [] } });
      }
    } else {
      // Clear state if no cart found for this user
      dispatch({ type: 'LOAD_CART', payload: { items: [] } });
    }
  }, [cartKey]);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    if (state.items.length > 0 || state.selectedShipping) {
      localStorage.setItem(cartKey, JSON.stringify(state));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [state, cartKey]);

  useEffect(() => {
    let isMounted = true;

    const loadCampaignRules = async () => {
      const sellerIds = Array.from(
        new Set(state.items.map((item) => item.product.seller_id).filter(Boolean))
      );

      if (sellerIds.length === 0) {
        if (isMounted) {
          setCampaignRules([]);
        }
        return;
      }

      try {
        const { data: participations, error: participationsError } = await (supabase.from as any)(
          'campaign_participants'
        )
          .select('campaign_id, seller_id')
          .in('seller_id', sellerIds);

        if (participationsError) {
          throw participationsError;
        }

        const campaignIds = Array.from(
          new Set((participations || []).map((item: any) => item.campaign_id).filter(Boolean))
        );

        if (campaignIds.length === 0) {
          if (isMounted) {
            setCampaignRules([]);
          }
          return;
        }

        const { data: campaigns, error: campaignsError } = await (supabase.from as any)('campaigns')
          .select('id, title, free_shipping_enabled, free_shipping_threshold, starts_at, ends_at, is_active')
          .in('id', campaignIds)
          .eq('is_active', true);

        if (campaignsError) {
          throw campaignsError;
        }

        const now = Date.now();
        const activeCampaigns = new Map(
          (campaigns || [])
            .filter((campaign: any) => {
              const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : now;
              const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : now;

              return startsAt <= now && now <= endsAt;
            })
            .map((campaign: any) => [campaign.id, campaign])
        );

        const rules = getCampaignFreeShippingRules(
          (participations || [])
            .map((participation: any) => {
              const campaign = activeCampaigns.get(participation.campaign_id);

              if (!campaign) {
                return null;
              }

              return {
                ...campaign,
                seller_id: participation.seller_id,
              };
            })
            .filter(Boolean)
        );

        if (isMounted) {
          setCampaignRules(rules);
        }
      } catch (error) {
        console.error('Error loading free shipping campaigns:', error);
        if (isMounted) {
          setCampaignRules([]);
        }
      }
    };

    loadCampaignRules();

    return () => {
      isMounted = false;
    };
  }, [state.items]);

  // Calculate cart totals
  const subtotal = calculateSubtotal(state.items);
  const productRules = useMemo(() => getProductFreeShippingRules(state.items), [state.items]);
  const freeShippingRule = useMemo(
    () => getAppliedFreeShippingRule(subtotal, [...productRules, ...campaignRules]),
    [campaignRules, productRules, subtotal]
  );
  const shipping = freeShippingRule
    ? 0
    : state.selectedShipping
      ? state.selectedShipping.price
      : calculateBaseShipping(state.items);
  const discount = 0; // TODO: Implement discount logic
  const total = calculateTotal(subtotal, shipping, discount);

  const cart: Cart = {
    items: state.items,
    subtotal,
    shipping,
    discount,
    total,
    isFreeShippingApplied: Boolean(freeShippingRule),
    freeShippingRule,
    selectedShipping: state.selectedShipping
  };

  const addToCart = (product: Product, quantity = 1, options?: Record<string, string>) => {
    // 🛑 Restriction: Seller cannot buy their own product
    const currentUserId = user?.id;
    const sellerId = product.seller?.id || (product as any).seller_id;

    if (currentUserId && sellerId && currentUserId === sellerId) {
      toast({
        variant: "destructive",
        title: "Operação não permitida",
        description: "Você não pode comprar um produto que você mesmo cadastrou.",
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, options } });
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    const item = state.items.find(item => item.id === itemId);
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

  const setShipping = (shipping: Cart['selectedShipping']) => {
    dispatch({ type: 'SET_SHIPPING', payload: shipping });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho.",
    });
  };

  const isInCart = (productId: string): boolean => {
    return state.items.some(item => item.product.id === productId);
  };

  const cartCount = state.items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = total;

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    setShipping,
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
