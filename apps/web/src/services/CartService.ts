import { supabase } from '@/integrations/supabase/client';
import { CartItem, Product, ProductVariant } from '@/types/product';

export class CartService {
  private static STORAGE_KEY = 'theadoro-cart';

  static getLocalCart(): CartItem[] {
    try {
      const savedCart = localStorage.getItem(this.STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  }

  static saveLocalCart(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  static clearLocalCart(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  }

  static async getUserCart(userId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            *,
            categories (
              id,
              name,
              slug,
              description,
              image
            ),
            profiles (
              id,
              full_name,
              avatar_url,
              location
            )
          ),
          product_variants (
            id,
            name,
            value,
            price_modifier,
            stock_quantity,
            sku
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        product: {
          id: item.products.id,
          name: item.products.name,
          description: item.products.description,
          price: item.products.price,
          original_price: item.products.original_price,
          images: item.products.images || [],
          rating: item.products.rating || 0,
          review_count: item.products.review_count || 0,
          in_stock: item.products.in_stock,
          stock_quantity: item.products.stock_quantity || 0,
          tags: item.products.tags || [],
          is_service: item.products.is_service,
          created_at: item.products.created_at,
          updated_at: item.products.updated_at,
          category: item.products.categories || {
            id: '',
            name: 'Sem categoria',
            slug: 'sem-categoria',
          },
          seller: {
            id: item.products.profiles?.id || '',
            name: item.products.profiles?.full_name || 'Vendedor',
            avatar: item.products.profiles?.avatar_url,
            location: item.products.profiles?.location || '',
            rating: 0,
            reviewCount: 0,
            verified: false,
            specialties: [],
            responseTime: '',
            joinedAt: '',
            description: '',
          }
        },
        quantity: item.quantity,
        variant: item.product_variants ? {
          id: item.product_variants.id,
          name: item.product_variants.name,
          value: item.product_variants.value,
          price_modifier: item.product_variants.price_modifier,
          stock_quantity: item.product_variants.stock_quantity,
          sku: item.product_variants.sku,
        } : undefined,
        addedAt: item.created_at,
      }));

    } catch (error) {
      console.error('Error fetching user cart:', error);
      throw error;
    }
  }

  static async addToCart(
    userId: string | null,
    product: Product,
    quantity: number = 1,
    variant?: ProductVariant
  ): Promise<CartItem> {
    if (!userId) {
      // Handle local cart for non-authenticated users
      const localCart = this.getLocalCart();
      const existingItemIndex = localCart.findIndex(
        item => item.product.id === product.id && 
        (!variant || item.variant?.id === variant.id)
      );

      const cartItem: CartItem = {
        id: `local-${Date.now()}-${Math.random()}`,
        product,
        quantity,
        variant,
        addedAt: new Date().toISOString(),
      };

      if (existingItemIndex >= 0) {
        localCart[existingItemIndex].quantity += quantity;
        cartItem.quantity = localCart[existingItemIndex].quantity;
      } else {
        localCart.push(cartItem);
      }

      this.saveLocalCart(localCart);
      return cartItem;
    }

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .eq('variant_id', variant?.id || null)
        .single();

      if (existingItem) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          product,
          quantity: data.quantity,
          variant,
          addedAt: data.created_at,
        };
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: product.id,
            quantity,
            variant_id: variant?.id || null,
          })
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          product,
          quantity: data.quantity,
          variant,
          addedAt: data.created_at,
        };
      }

    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  static async updateCartItem(
    userId: string | null,
    itemId: string,
    quantity: number
  ): Promise<void> {
    if (!userId) {
      // Handle local cart
      const localCart = this.getLocalCart();
      const itemIndex = localCart.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          localCart.splice(itemIndex, 1);
        } else {
          localCart[itemIndex].quantity = quantity;
        }
        this.saveLocalCart(localCart);
      }
      return;
    }

    try {
      if (quantity <= 0) {
        await this.removeFromCart(userId, itemId);
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)
          .eq('user_id', userId);

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  static async removeFromCart(userId: string | null, itemId: string): Promise<void> {
    if (!userId) {
      // Handle local cart
      const localCart = this.getLocalCart();
      const filteredCart = localCart.filter(item => item.id !== itemId);
      this.saveLocalCart(filteredCart);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  static async clearCart(userId: string | null): Promise<void> {
    if (!userId) {
      this.clearLocalCart();
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  static async syncLocalCartToUser(userId: string): Promise<void> {
    try {
      const localCart = this.getLocalCart();
      
      if (localCart.length === 0) return;

      // Add each local cart item to user's cart
      for (const item of localCart) {
        await this.addToCart(userId, item.product, item.quantity, item.variant);
      }

      // Clear local cart after sync
      this.clearLocalCart();

    } catch (error) {
      console.error('Error syncing local cart to user:', error);
      throw error;
    }
  }

  static calculateCartTotals(items: CartItem[]) {
    const subtotal = items.reduce((sum, item) => {
      const itemPrice = item.product.price + (item.variant?.price_modifier || 0);
      return sum + (itemPrice * item.quantity);
    }, 0);

    // Simple shipping calculation
    const hasPhysicalItems = items.some(item => !item.product.is_service);
    const shipping = hasPhysicalItems && subtotal < 200 ? 15 : 0;

    // Simple tax calculation
    const tax = subtotal * 0.05; // 5% tax

    const total = subtotal + shipping + tax;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
    };
  }

  static validateCartItem(item: CartItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if product is still available
    if (!item.product.in_stock) {
      errors.push(`${item.product.name} está fora de estoque`);
    }

    // Check stock quantity
    const availableStock = item.variant?.stock_quantity || item.product.stock_quantity;
    if (item.quantity > availableStock) {
      errors.push(`${item.product.name} tem apenas ${availableStock} unidades disponíveis`);
    }

    // Check if variant is still valid
    if (item.variant && item.variant.stock_quantity <= 0) {
      errors.push(`A variação selecionada de ${item.product.name} está fora de estoque`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async validateCart(items: CartItem[]): Promise<{ isValid: boolean; errors: string[]; validItems: CartItem[] }> {
    const errors: string[] = [];
    const validItems: CartItem[] = [];

    for (const item of items) {
      const validation = this.validateCartItem(item);
      
      if (validation.isValid) {
        validItems.push(item);
      } else {
        errors.push(...validation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validItems,
    };
  }
}