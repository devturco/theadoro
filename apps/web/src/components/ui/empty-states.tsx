import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Search,
  Plus,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) => (
  <div className={cn(
    'flex flex-col items-center justify-center text-center p-8 min-h-[400px]',
    className
  )}>
    {icon && (
      <div className="mb-4 text-muted-foreground">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
    )}
    {action && (
      <Button
        onClick={action.onClick}
        variant={action.variant || 'default'}
      >
        {action.label}
      </Button>
    )}
  </div>
);

// Specific empty states for common scenarios

export const EmptyProducts = ({ onAddProduct }: { onAddProduct?: () => void }) => (
  <EmptyState
    icon={<Package className="h-16 w-16" />}
    title="Nenhum produto encontrado"
    description="Você ainda não tem produtos cadastrados. Comece adicionando seu primeiro produto."
    action={onAddProduct ? {
      label: 'Adicionar Produto',
      onClick: onAddProduct
    } : undefined}
  />
);

export const EmptyOrders = ({ onViewProducts }: { onViewProducts?: () => void }) => (
  <EmptyState
    icon={<ShoppingCart className="h-16 w-16" />}
    title="Nenhum pedido encontrado"
    description="Você ainda não tem pedidos. Explore nossos produtos e faça seu primeiro pedido."
    action={onViewProducts ? {
      label: 'Ver Produtos',
      onClick: onViewProducts
    } : undefined}
  />
);

export const EmptyUsers = ({ onInviteUser }: { onInviteUser?: () => void }) => (
  <EmptyState
    icon={<Users className="h-16 w-16" />}
    title="Nenhum usuário encontrado"
    description="Não há usuários cadastrados no sistema."
    action={onInviteUser ? {
      label: 'Convidar Usuário',
      onClick: onInviteUser
    } : undefined}
  />
);

export const EmptyReports = ({ onCreateReport }: { onCreateReport?: () => void }) => (
  <EmptyState
    icon={<FileText className="h-16 w-16" />}
    title="Nenhum relatório disponível"
    description="Não há relatórios gerados ainda. Crie seu primeiro relatório para visualizar dados."
    action={onCreateReport ? {
      label: 'Gerar Relatório',
      onClick: onCreateReport
    } : undefined}
  />
);

export const EmptySearchResults = ({ 
  query, 
  onClearSearch 
}: { 
  query?: string;
  onClearSearch?: () => void;
}) => (
  <EmptyState
    icon={<Search className="h-16 w-16" />}
    title="Nenhum resultado encontrado"
    description={
      query 
        ? `Não encontramos resultados para "${query}". Tente usar termos diferentes.`
        : "Sua busca não retornou resultados."
    }
    action={onClearSearch ? {
      label: 'Limpar Busca',
      onClick: onClearSearch,
      variant: 'outline'
    } : undefined}
  />
);

export const EmptyWishlist = ({ onBrowseProducts }: { onBrowseProducts?: () => void }) => (
  <EmptyState
    icon={<Inbox className="h-16 w-16" />}
    title="Sua lista de desejos está vazia"
    description="Adicione produtos à sua lista de desejos para acompanhar itens que você gostaria de comprar."
    action={onBrowseProducts ? {
      label: 'Explorar Produtos',
      onClick: onBrowseProducts
    } : undefined}
  />
);

export const EmptyCart = ({ onBrowseProducts }: { onBrowseProducts?: () => void }) => (
  <EmptyState
    icon={<ShoppingCart className="h-16 w-16" />}
    title="Seu carrinho está vazio"
    description="Adicione produtos ao seu carrinho para continuar com a compra."
    action={onBrowseProducts ? {
      label: 'Continuar Comprando',
      onClick: onBrowseProducts
    } : undefined}
  />
);

export const ErrorState = ({ 
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado. Tente novamente.',
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <EmptyState
    icon={<AlertCircle className="h-16 w-16 text-red-500" />}
    title={title}
    description={description}
    action={onRetry ? {
      label: 'Tentar Novamente',
      onClick: onRetry,
      variant: 'outline'
    } : undefined}
  />
);

// Card-based empty state for smaller containers
export const EmptyCard = ({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) => (
  <Card className={className}>
    <CardContent className="p-6">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
        className="min-h-[200px] p-0"
      />
    </CardContent>
  </Card>
);

// Table empty state
export const EmptyTable = ({
  columns,
  message = 'Nenhum item encontrado',
  action
}: {
  columns: number;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) => (
  <tr>
    <td colSpan={columns} className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
        {action && (
          <Button onClick={action.onClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </div>
    </td>
  </tr>
);