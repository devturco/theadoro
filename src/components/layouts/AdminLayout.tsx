import { ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  BarChart3,
  LogOut,
  Gift,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface AdminLayoutProps {
  children?: ReactNode;
}

const adminMenuItems = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Usuários',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Aprovações',
    url: '/admin/approvals',
    icon: ShieldCheck,
  },
  {
    title: 'Produtos',
    url: '/admin/products',
    icon: Package,
  },
  {
    title: 'Categorias',
    url: '/admin/categories',
    icon: FolderTree,
  },
  {
    title: 'Pedidos',
    url: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Relatórios',
    url: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Insights',
    url: '/admin/insights',
    icon: Sparkles,
  },
  {
    title: 'Conteúdo',
    url: '/admin/content',
    icon: LayoutTemplate,
  },
  {
    title: 'Gerais',
    url: '/admin/settings',
    icon: Settings,
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-2">
              <img
                src="/icon.png"
                alt="THEADORO"
                className="h-6 w-6"
              />
              <span className="font-bold text-lg">THEADORO Admin</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {profile?.full_name || 'Admin'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="border-b bg-background p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Painel Administrativo</h1>
            </div>
          </header>

          <div className="flex-1 p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;