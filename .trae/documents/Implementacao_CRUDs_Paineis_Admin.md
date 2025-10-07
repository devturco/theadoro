# Implementação de CRUDs e Painéis Administrativos - THEADORO

## 1. Estrutura de Autenticação e Proteção de Rotas

### 1.1 Sistema de Roles e Permissões

```typescript
// types/auth.ts
export type UserRole = 'admin' | 'seller' | 'buyer';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  address?: string;
  postal_code?: string;
  roles: UserRole[];
}

// hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// hooks/useRole.ts
export const useRole = (requiredRole: UserRole) => {
  const { user, roles } = useAuth();
  return {
    hasRole: roles.includes(requiredRole),
    isAdmin: roles.includes('admin'),
    isSeller: roles.includes('seller') || roles.includes('admin'),
    isBuyer: roles.includes('buyer'),
  };
};
```

### 1.2 Componentes de Proteção de Rota

```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback = <Navigate to="/auth" />
}) => {
  const { user, loading } = useAuth();
  const { hasRole } = useRole(requiredRole);

  if (loading) return <LoadingSpinner />;
  if (!user) return fallback;
  if (requiredRole && !hasRole) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

// components/auth/RoleGuard.tsx
interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  fallback = null
}) => {
  const { roles: userRoles } = useAuth();
  const hasPermission = roles.some(role => userRoles.includes(role));

  return hasPermission ? <>{children}</> : fallback;
};
```

## 2. Painéis Administrativos

### 2.1 Painel do Administrador

#### Dashboard Principal
```typescript
// pages/admin/Dashboard.tsx
export const AdminDashboard = () => {
  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchAdminMetrics
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Usuários Totais"
          value={metrics?.totalUsers}
          icon={Users}
          trend={metrics?.usersTrend}
        />
        <MetricCard
          title="Vendas do Mês"
          value={metrics?.monthlySales}
          icon={DollarSign}
          trend={metrics?.salesTrend}
        />
        <MetricCard
          title="Produtos Ativos"
          value={metrics?.activeProducts}
          icon={Package}
          trend={metrics?.productsTrend}
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={metrics?.pendingOrders}
          icon={Clock}
          trend={metrics?.ordersTrend}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={metrics?.salesChart} />
        <UsersChart data={metrics?.usersChart} />
      </div>

      {/* Ações Rápidas */}
      <QuickActions />
    </div>
  );
};
```

#### Gestão de Usuários
```typescript
// pages/admin/Users.tsx
export const AdminUsers = () => {
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => fetchUsers(filters)
  });

  const approveSellerMutation = useMutation({
    mutationFn: approveSeller,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Vendedor aprovado com sucesso!');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar usuários..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="buyer">Compradores</SelectItem>
                <SelectItem value="seller">Vendedores</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({ role: '', status: '', search: '' })}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <DataTable
        columns={userColumns}
        data={users || []}
        loading={isLoading}
        onRowAction={(action, user) => handleUserAction(action, user)}
      />
    </div>
  );
};
```

### 2.2 Painel do Vendedor

#### Gestão de Produtos
```typescript
// pages/seller/Products.tsx
export const SellerProducts = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: () => fetchSellerProducts(user?.id)
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Produto excluído com sucesso!');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meus Produtos</h1>
          <p className="text-muted-foreground">{products?.length || 0} produtos cadastrados</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Grid de Produtos */}
      {products?.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Comece cadastrando seu primeiro produto"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              Cadastrar Produto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => deleteProductMutation.mutate(product.id)}
              onToggleActive={() => toggleProductActive(product.id, product.is_active)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <ProductFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries(['seller-products']);
        }}
      />

      <ProductFormModal
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={() => {
          setEditingProduct(null);
          queryClient.invalidateQueries(['seller-products']);
        }}
      />
    </div>
  );
};
```

## 3. Componentes CRUD Reutilizáveis

### 3.1 DataTable Genérica
```typescript
// components/ui/DataTable.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  onRowAction?: (action: string, row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  pagination = true,
  sorting = true,
  filtering = true,
  onRowAction
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: { sorting, columnFilters, pagination }
  });

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      {filtering && <TableFilters table={table} />}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center space-x-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => header.column.toggleSorting()}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && <TablePagination table={table} />}
    </div>
  );
}
```

### 3.2 Formulário Genérico
```typescript
// components/forms/GenericForm.tsx
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'file' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

interface GenericFormProps {
  fields: FormField[];
  onSubmit: (data: any) => void;
  defaultValues?: any;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
}

export const GenericForm: React.FC<GenericFormProps> = ({
  fields,
  onSubmit,
  defaultValues = {},
  loading = false,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  onCancel
}) => {
  const form = useForm({
    defaultValues,
    resolver: zodResolver(createValidationSchema(fields))
  });

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'select':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'file':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <FileUpload
                    onUpload={(urls) => formField.onChange(urls)}
                    multiple={field.name === 'images'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field) => (
          <div key={field.name}>
            {renderField(field)}
          </div>
        ))}

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

## 4. Hooks Customizados para CRUDs

### 4.1 Hook genérico para operações CRUD
```typescript
// hooks/useCRUD.ts
export function useCRUD<T>(
  tableName: string,
  queryKey: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
  }
) {
  const queryClient = useQueryClient();

  // Read (List)
  const {
    data: items,
    isLoading,
    error
  } = useQuery({
    queryKey: [queryKey, options?.filters],
    queryFn: async () => {
      let query = supabase.from(tableName).select(options?.select || '*');
      
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    }
  });

  // Create
  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<T>) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newItem)
        .select()
        .single();
      
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey]);
      toast.success('Item criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar item');
    }
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey]);
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar item');
    }
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey]);
      toast.success('Item excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir item');
    }
  });

  return {
    items,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
```

### 4.2 Hook específico para produtos
```typescript
// hooks/useProducts.ts
export const useProducts = (sellerId?: string) => {
  return useCRUD<Product>('products', 'products', {
    select: `
      *,
      categories (id, name, slug),
      profiles!seller_id (id, full_name, city),
      reviews (rating)
    `,
    filters: sellerId ? { seller_id: sellerId } : undefined
  });
};

export const useProductActions = () => {
  const queryClient = useQueryClient();

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Status do produto atualizado!');
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ featured: !featured })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Produto destacado atualizado!');
    }
  });

  return {
    toggleActive: toggleActiveMutation.mutate,
    toggleFeatured: toggleFeaturedMutation.mutate,
    isToggling: toggleActiveMutation.isPending || toggleFeaturedMutation.isPending
  };
};
```

## 5. Integração com Supabase

### 5.1 Upload de Imagens
```typescript
// utils/storage.ts
export const uploadImages = async (files: File[], bucket: string = 'products') => {
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  });

  return Promise.all(uploadPromises);
};

// components/FileUpload.tsx
export const FileUpload: React.FC<{
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
  accept?: string;
}> = ({ onUpload, multiple = false, accept = "image/*" }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const urls = await uploadImages(fileArray);
      onUpload(urls);
    } catch (error) {
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleUpload(e.target.files)}
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-muted-foreground">Fazendo upload...</p>}
    </div>
  );
};
```

### 5.2 Real-time Subscriptions
```typescript
// hooks/useRealtime.ts
export const useRealtimeSubscription = (
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) => {
  useEffect(() => {
    let subscription: any;

    const setupSubscription = () => {
      let channel = supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table,
            filter 
          }, 
          (payload) => {
            if (callback) {
              callback(payload);
            } else {
              // Invalidate queries by default
              queryClient.invalidateQueries([table]);
            }
          }
        );

      subscription = channel.subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [table, filter, callback]);
};

// Uso em componentes
export const OrdersList = () => {
  const { data: orders } = useQuery(['orders'], fetchOrders);

  useRealtimeSubscription('orders', undefined, (payload) => {
    // Atualizar lista quando houver mudanças
    queryClient.invalidateQueries(['orders']);
    
    // Mostrar notificação para novos pedidos
    if (payload.eventType === 'INSERT') {
      toast.success('Novo pedido recebido!');
    }
  });

  return <OrdersTable orders={orders} />;
};
```

Esta documentação fornece uma base sólida para implementar toda a estrutura de autenticação, painéis administrativos e CRUDs completos no projeto THEADORO. A arquitetura é escalável e utiliza as melhores práticas do React e Supabase.