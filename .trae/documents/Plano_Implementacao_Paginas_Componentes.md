# Plano de Implementação - Páginas e Componentes THEADORO

## 1. Estrutura de Pastas Proposta

```
src/
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleGuard.tsx
│   │   └── LoginForm.tsx
│   ├── admin/
│   │   ├── UserManagement/
│   │   ├── ProductModeration/
│   │   ├── CategoryManagement/
│   │   └── ReportsPanel/
│   ├── seller/
│   │   ├── ProductForm/
│   │   ├── SalesPanel/
│   │   ├── AppointmentCalendar/
│   │   └── PerformanceMetrics/
│   ├── buyer/
│   │   ├── ProductCard/
│   │   ├── OrderHistory/
│   │   ├── WishlistManager/
│   │   └── AppointmentBooking/
│   ├── shared/
│   │   ├── DataTable/
│   │   ├── GenericForm/
│   │   ├── FileUpload/
│   │   ├── SearchFilters/
│   │   ├── Pagination/
│   │   └── LoadingStates/
│   └── ui/ (shadcn components)
├── pages/
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Products.tsx
│   │   ├── Categories.tsx
│   │   ├── Orders.tsx
│   │   └── Reports.tsx
│   ├── seller/
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── ProductForm.tsx
│   │   ├── Sales.tsx
│   │   ├── Appointments.tsx
│   │   └── Reports.tsx
│   ├── buyer/
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── Appointments.tsx
│   │   ├── Wishlist.tsx
│   │   └── Profile.tsx
│   └── public/
│       ├── Home.tsx
│       ├── Products.tsx
│       ├── ProductDetail.tsx
│       ├── Cart.tsx
│       └── Checkout.tsx
├── hooks/
│   ├── useCRUD.ts
│   ├── useAuth.ts
│   ├── useRole.ts
│   ├── useProducts.ts
│   ├── useOrders.ts
│   ├── useRealtime.ts
│   └── useFileUpload.ts
├── services/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── users.ts
│   │   └── categories.ts
│   ├── storage.ts
│   └── notifications.ts
├── types/
│   ├── auth.ts
│   ├── product.ts
│   ├── order.ts
│   ├── user.ts
│   └── common.ts
└── utils/
    ├── validation.ts
    ├── formatting.ts
    ├── constants.ts
    └── helpers.ts
```

## 2. Páginas Administrativas Detalhadas

### 2.1 Dashboard do Administrador

```typescript
// pages/admin/Dashboard.tsx
export const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-wine">Painel Administrativo</h1>
            <p className="text-muted-foreground">Visão geral da plataforma</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
            <Button variant="wine">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Usuários Totais"
            value="1,234"
            change="+12%"
            trend="up"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Vendas do Mês"
            value="R$ 45.678"
            change="+8%"
            trend="up"
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Produtos Ativos"
            value="567"
            change="+5%"
            trend="up"
            icon={Package}
            color="purple"
          />
          <MetricCard
            title="Pedidos Pendentes"
            value="23"
            change="-15%"
            trend="down"
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Novos Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersChart />
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivities />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
```

### 2.2 Gestão de Usuários

```typescript
// pages/admin/Users.tsx
export const AdminUsers = () => {
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    dateRange: { from: null, to: null }
  });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => fetchUsers(filters)
  });

  const userColumns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: "avatar_url",
      header: "",
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.getValue("avatar_url")} />
          <AvatarFallback>
            {row.original.full_name?.charAt(0) || row.original.email.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("full_name") || "Sem nome"}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role} variant={getRoleVariant(role)}>
              {getRoleLabel(role)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Localização",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.city && row.original.state 
            ? `${row.original.city}, ${row.original.state}`
            : "Não informado"
          }
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Cadastro",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("created_at")), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => viewUser(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editUser(row.original.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => promoteToSeller(row.original.id)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Promover a Vendedor
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => blockUser(row.original.id)}
              className="text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Bloquear Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-wine">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              {users?.length || 0} usuários cadastrados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="wine">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full"
                />
              </div>
              
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

              <Button 
                variant="outline" 
                onClick={() => setFilters({ search: '', role: '', status: '', dateRange: { from: null, to: null } })}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ações em Lote */}
        {selectedUsers.length > 0 && (
          <Card className="border-wine">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedUsers.length} usuário(s) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Promover
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Ban className="mr-2 h-4 w-4" />
                    Bloquear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={userColumns}
              data={users || []}
              loading={isLoading}
              onRowSelectionChange={setSelectedUsers}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
```

## 3. Componentes Reutilizáveis Específicos

### 3.1 Componente de Métricas

```typescript
// components/shared/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'blue',
  loading = false
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100'
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-scale">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              <span className={`text-xs font-medium ${trendClasses[trend]}`}>
                {change} vs mês anterior
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.2 Componente de Upload de Arquivos

```typescript
// components/shared/FileUpload.tsx
interface FileUploadProps {
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // em MB
  bucket?: string;
  folder?: string;
  preview?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  multiple = false,
  accept = "image/*",
  maxSize = 5,
  bucket = 'images',
  folder = 'products',
  preview = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${maxSize}MB.`;
    }
    
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      return 'Tipo de arquivo não suportado.';
    }
    
    return null;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validar arquivos
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setUploading(true);
    
    try {
      // Criar previews
      if (preview) {
        const previewUrls = fileArray.map(file => URL.createObjectURL(file));
        setPreviews(previewUrls);
      }

      // Upload para Supabase
      const uploadPromises = fileArray.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      onUpload(urls);
      toast.success(`${urls.length} arquivo(s) enviado(s) com sucesso!`);
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-wine bg-wine/5' : 'border-gray-300'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-wine hover:bg-wine/5'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <span className="text-wine font-medium">Clique para enviar</span>
              <span className="text-gray-500"> ou arraste arquivos aqui</span>
            </div>
            <p className="text-xs text-gray-500">
              {accept.includes('image') ? 'PNG, JPG, GIF' : 'Arquivos'} até {maxSize}MB
            </p>
          </div>
        </label>
      </div>

      {/* Loading */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Enviando arquivos...</span>
        </div>
      )}

      {/* Previews */}
      {preview && previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  URL.revokeObjectURL(url);
                  setPreviews(prev => prev.filter((_, i) => i !== index));
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 4. Layouts e Navegação

### 4.1 Layout Administrativo

```typescript
// components/layouts/AdminLayout.tsx
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin } = useRole('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Usuários', href: '/admin/users', icon: Users },
    { name: 'Produtos', href: '/admin/products', icon: Package },
    { name: 'Categorias', href: '/admin/categories', icon: Tag },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Relatórios', href: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <AdminSidebar navigation={navigation} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <AdminSidebar navigation={navigation} />
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <AdminNotifications />
              <AdminUserMenu user={user} />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
```

## 5. Cronograma de Implementação

### Fase 1: Infraestrutura Base (Semana 1-2)
- [ ] Configurar estrutura de pastas
- [ ] Implementar sistema de autenticação robusto
- [ ] Criar componentes de proteção de rota
- [ ] Desenvolver hooks customizados (useCRUD, useAuth, useRole)
- [ ] Implementar layouts base (Admin, Seller, Buyer)

### Fase 2: Componentes Reutilizáveis (Semana 2-3)
- [ ] DataTable genérica com filtros e paginação
- [ ] GenericForm com validação
- [ ] FileUpload com preview e validação
- [ ] MetricCard e componentes de dashboard
- [ ] Componentes de loading e estados vazios

### Fase 3: Painel Administrativo (Semana 3-4)
- [ ] Dashboard admin com métricas
- [ ] Gestão de usuários com aprovação de vendedores
- [ ] Moderação de produtos
- [ ] Gestão de categorias
- [ ] Controle de pedidos

### Fase 4: Painel do Vendedor (Semana 4-5)
- [ ] Dashboard do vendedor
- [ ] CRUD completo de produtos
- [ ] Gestão de vendas e pedidos
- [ ] Calendário de agendamentos
- [ ] Relatórios de performance

### Fase 5: Painel do Comprador (Semana 5-6)
- [ ] Dashboard do comprador
- [ ] Histórico de pedidos
- [ ] Gestão de agendamentos
- [ ] Lista de favoritos
- [ ] Edição de perfil

### Fase 6: Funcionalidades Avançadas (Semana 6-7)
- [ ] Sistema de notificações em tempo real
- [ ] Upload e gestão de imagens
- [ ] Relatórios e analytics
- [ ] Sistema de busca avançada
- [ ] Integração com pagamentos

### Fase 7: Testes e Refinamentos (Semana 7-8)
- [ ] Testes de integração
- [ ] Otimização de performance
- [ ] Ajustes de UX/UI
- [ ] Documentação final
- [ ] Deploy e configuração de produção

Este plano fornece uma roadmap clara para implementar toda a estrutura de autenticação, páginas e painéis administrativos com CRUDs completos no projeto THEADORO.