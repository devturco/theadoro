# Especificações Técnicas - Hooks e Serviços THEADORO

## 1. Hooks Customizados

### 1.1 Hook de CRUD Genérico

```typescript
// hooks/useCRUD.ts
interface CRUDOptions<T> {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Record<string, any>;
  realtime?: boolean;
}

interface CRUDResult<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  create: (item: Partial<T>) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  refresh: () => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}

export function useCRUD<T extends { id: string }>(
  options: CRUDOptions<T>
): CRUDResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const queryClient = useQueryClient();

  // Fetch data with pagination
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(options.table)
        .select(options.select || '*', { count: 'exact' });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && key.includes('search')) {
              query = query.ilike(key.replace('_search', ''), `%${value}%`);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: result, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setData(result as T[]);
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.table, options.select, options.filters, options.orderBy, page, pageSize]);

  // Create item
  const create = useCallback(async (item: Partial<T>): Promise<T> => {
    const { data: result, error } = await supabase
      .from(options.table)
      .insert(item)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setData(prev => prev ? [result, ...prev] : [result]);
    setTotal(prev => prev + 1);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: [options.table] });

    return result;
  }, [options.table, queryClient]);

  // Update item
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<T> => {
    const { data: result, error } = await supabase
      .from(options.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setData(prev => 
      prev ? prev.map(item => item.id === id ? result : item) : [result]
    );

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: [options.table] });

    return result;
  }, [options.table, queryClient]);

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(options.table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update local state
    setData(prev => prev ? prev.filter(item => item.id !== id) : null);
    setTotal(prev => prev - 1);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: [options.table] });
  }, [options.table, queryClient]);

  // Bulk delete
  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from(options.table)
      .delete()
      .in('id', ids);

    if (error) throw error;

    // Update local state
    setData(prev => prev ? prev.filter(item => !ids.includes(item.id)) : null);
    setTotal(prev => prev - ids.length);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: [options.table] });
  }, [options.table, queryClient]);

  // Setup realtime subscription
  useEffect(() => {
    if (!options.realtime) return;

    const subscription = supabase
      .channel(`${options.table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: options.table },
        (payload) => {
          console.log('Realtime change:', payload);
          fetchData(); // Refresh data on changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [options.realtime, options.table, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    create,
    update,
    delete: deleteItem,
    bulkDelete,
    refresh: fetchData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      setPage,
      setPageSize,
    },
  };
}
```

### 1.2 Hook de Autenticação Avançado

```typescript
// hooks/useAuth.ts
interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: any
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    toast.success('Conta criada! Verifique seu email para confirmar.');
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    toast.success('Login realizado com sucesso!');
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;

    setUser(null);
    setProfile(null);
    toast.success('Logout realizado com sucesso!');
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    setProfile(data);
    toast.success('Perfil atualizado com sucesso!');
  }, [user]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    toast.success('Email de recuperação enviado!');
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;

    toast.success('Senha atualizada com sucesso!');
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;
  }, []);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (session?.user) {
          setUser(session.user as AuthUser);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshSession,
  };
};
```

### 1.3 Hook de Roles e Permissões

```typescript
// hooks/useRole.ts
type AppRole = 'admin' | 'seller' | 'buyer';

interface RolePermissions {
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canModerateContent: boolean;
  canManageCategories: boolean;
}

interface UseRoleResult {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  permissions: RolePermissions;
  isAdmin: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  loading: boolean;
}

export const useRole = (): UseRoleResult => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user roles
  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const userRoles = data.map(item => item.role as AppRole);
      setRoles(userRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((rolesToCheck: AppRole[]): boolean => {
    return rolesToCheck.some(role => roles.includes(role));
  }, [roles]);

  // Calculate permissions based on roles
  const permissions = useMemo((): RolePermissions => {
    const isAdmin = roles.includes('admin');
    const isSeller = roles.includes('seller');

    return {
      canManageUsers: isAdmin,
      canManageProducts: isAdmin || isSeller,
      canManageOrders: isAdmin || isSeller,
      canViewReports: isAdmin || isSeller,
      canModerateContent: isAdmin,
      canManageCategories: isAdmin,
    };
  }, [roles]);

  // Convenience flags
  const isAdmin = hasRole('admin');
  const isSeller = hasRole('seller');
  const isBuyer = hasRole('buyer');

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    hasRole,
    hasAnyRole,
    permissions,
    isAdmin,
    isSeller,
    isBuyer,
    loading,
  };
};
```

### 1.4 Hook de Upload de Arquivos

```typescript
// hooks/useFileUpload.ts
interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // MB
  allowedTypes?: string[];
  multiple?: boolean;
}

interface UploadResult {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadFiles: (files: FileList | File[]) => Promise<string[]>;
  deleteFile: (url: string) => Promise<void>;
}

export const useFileUpload = (options: UploadOptions): UploadResult => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${options.maxSize}MB.`;
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${options.allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFiles = async (files: FileList | File[]): Promise<string[]> => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

        const { data, error: uploadError } = await supabase.storage
          .from(options.bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Update progress
        setProgress(((index + 1) / fileArray.length) * 100);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      return urls;

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (url: string): Promise<void> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from(options.bucket)
        .remove([filePath]);

      if (error) throw error;

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    uploading,
    progress,
    error,
    uploadFiles,
    deleteFile,
  };
};
```

## 2. Serviços de API

### 2.1 Serviço de Produtos

```typescript
// services/api/products.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string;
  seller_id: string;
  is_active: boolean;
  product_type: 'physical' | 'service';
  stock_quantity?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  seller?: UserProfile;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  seller_id?: string;
  is_active?: boolean;
  product_type?: 'physical' | 'service';
  price_min?: number;
  price_max?: number;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string;
  product_type: 'physical' | 'service';
  stock_quantity?: number;
}

class ProductService {
  // Get products with filters and pagination
  async getProducts(
    filters: ProductFilters = {},
    page = 1,
    pageSize = 12
  ): Promise<{ data: Product[]; total: number }> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles(id, full_name, avatar_url)
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.seller_id) {
      query = query.eq('seller_id', filters.seller_id);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.product_type) {
      query = query.eq('product_type', filters.product_type);
    }

    if (filters.price_min !== undefined) {
      query = query.gte('price', filters.price_min);
    }

    if (filters.price_max !== undefined) {
      query = query.lte('price', filters.price_max);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  }

  // Get single product
  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles(id, full_name, avatar_url, city, state)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  }

  // Create product
  async createProduct(productData: CreateProductData): Promise<Product> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        seller_id: user.id,
      })
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return data;
  }

  // Update product
  async updateProduct(id: string, updates: Partial<CreateProductData>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return data;
  }

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Toggle product active status
  async toggleProductStatus(id: string): Promise<Product> {
    // First get current status
    const { data: product } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', id)
      .single();

    if (!product) throw new Error('Produto não encontrado');

    // Toggle status
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return data;
  }

  // Get seller products
  async getSellerProducts(sellerId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles(id, full_name, avatar_url)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data || [];
  }
}

export const productService = new ProductService();
```

### 2.2 Serviço de Pedidos

```typescript
// services/api/orders.ts
export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  created_at: string;
  updated_at: string;
  buyer?: UserProfile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface CreateOrderData {
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
  shipping_address: Order['shipping_address'];
}

class OrderService {
  // Get orders with filters
  async getOrders(
    filters: {
      buyer_id?: string;
      seller_id?: string;
      status?: Order['status'];
    } = {},
    page = 1,
    pageSize = 10
  ): Promise<{ data: Order[]; total: number }> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!orders_buyer_id_fkey(id, full_name, email, avatar_url),
        items:order_items(
          id,
          quantity,
          unit_price,
          total_price,
          product:products(id, name, images, seller_id)
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.buyer_id) {
      query = query.eq('buyer_id', filters.buyer_id);
    }

    if (filters.seller_id) {
      query = query.eq('items.product.seller_id', filters.seller_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  }

  // Get single order
  async getOrder(id: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!orders_buyer_id_fkey(id, full_name, email, avatar_url, phone),
        items:order_items(
          id,
          quantity,
          unit_price,
          total_price,
          product:products(
            id,
            name,
            images,
            seller_id,
            seller:profiles(id, full_name, email, phone)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  }

  // Create order
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuário não autenticado');

    // Calculate total amount
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.unit_price * item.quantity),
      0
    );

    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        shipping_address: orderData.shipping_address,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Return complete order
    return this.getOrder(order.id);
  }

  // Update order status
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.getOrder(id);
  }

  // Cancel order
  async cancelOrder(id: string): Promise<Order> {
    return this.updateOrderStatus(id, 'cancelled');
  }

  // Get order statistics
  async getOrderStats(sellerId?: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    let query = supabase
      .from('orders')
      .select('status, total_amount');

    if (sellerId) {
      // Filter by seller through order items
      query = query.eq('items.product.seller_id', sellerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };

    data.forEach(order => {
      stats[order.status as keyof typeof stats]++;
      if (order.status !== 'cancelled') {
        stats.totalRevenue += order.total_amount;
      }
    });

    return stats;
  }
}

export const orderService = new OrderService();
```

## 3. Utilitários e Helpers

### 3.1 Validações com Zod

```typescript
// utils/validation.ts
import { z } from 'zod';

// User validation schemas
export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  category_id: z.string().uuid('Categoria é obrigatória'),
  product_type: z.enum(['physical', 'service']),
  stock_quantity: z.number().min(0).optional(),
  images: z.array(z.string().url()).min(1, 'Pelo menos uma imagem é obrigatória'),
});

// Order validation schemas
export const shippingAddressSchema = z.object({
  street: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zip_code: z.string().min(8, 'CEP inválido'),
  country: z.string().default('Brasil'),
});

export const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0.01),
  })).min(1, 'Pelo menos um item é obrigatório'),
  shipping_address: shippingAddressSchema,
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug é obrigatório'),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
});
```

### 3.2 Formatação e Helpers

```typescript
// utils/formatting.ts

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Format date
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

// Format date with time
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Format phone number
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
};

// Format CEP
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{5})(\d{3})$/);
  
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  return cep;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate slug
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice: number, salePrice: number): number => {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Get order status color
export const getOrderStatusColor = (status: string): string => {
  const colors = {
    pending: 'yellow',
    confirmed: 'blue',
    processing: 'purple',
    shipped: 'orange',
    delivered: 'green',
    cancelled: 'red',
  };
  
  return colors[status as keyof typeof colors] || 'gray';
};

// Get order status label
export const getOrderStatusLabel = (status: string): string => {
  const labels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };
  
  return labels[status as keyof typeof labels] || status;
};

// Get role label
export const getRoleLabel = (role: string): string => {
  const labels = {
    admin: 'Administrador',
    seller: 'Vendedor',
    buyer: 'Comprador',
  };
  
  return labels[role as keyof typeof labels] || role;
};

// Get role badge variant
export const getRoleVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants = {
    admin: 'destructive' as const,
    seller: 'default' as const,
    buyer: 'secondary' as const,
  };
  
  return variants[role as keyof typeof variants] || 'outline';
};
```

Este documento fornece uma base sólida para implementar todos os hooks customizados, serviços de API e utilitários necessários para o sistema completo do THEADORO Gift Marketplace.