import { ReactNode, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@theadoro/ui';
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
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children?: ReactNode;
}

const adminMenuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Usuários', url: '/admin/users', icon: Users },
  { title: 'Aprovações', url: '/admin/approvals', icon: ShieldCheck },
  { title: 'Produtos', url: '/admin/products', icon: Package },
  { title: 'Categorias', url: '/admin/categories', icon: FolderTree },
  { title: 'Assinaturas', url: '/admin/subscriptions', icon: ShieldCheck },
  { title: 'Faturas', url: '/admin/invoices', icon: ShoppingCart },
  { title: 'Pedidos', url: '/admin/orders', icon: ShoppingCart },
  { title: 'Relatórios', url: '/admin/reports', icon: BarChart3 },
  { title: 'Insights', url: '/admin/insights', icon: Sparkles },
  { title: 'Conteúdo', url: '/admin/content', icon: LayoutTemplate },
  { title: 'Embalagens', url: '/admin/gift-wraps', icon: Gift },
  { title: 'Campanhas', url: '/admin/campaigns', icon: Sparkles },
  { title: 'Gerais', url: '/admin/settings', icon: Settings },
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
              <img src="/icon.png" alt="THEADORO" className="h-6 w-6" />
              <span className="font-bold text-base">THEADORO Admin</span>
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
              <div className="text-sm text-muted-foreground truncate">
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

        <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-28">
          <Header />

          <div className="flex-1 p-3 sm:p-6 overflow-auto">
            <div className="container mx-auto">
              <div className="mb-6 lg:mb-8">
                <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Painel Administrativo</h1>
                <p className="text-sm text-gray-500">Gestão centralizada da plataforma THEADORO</p>
              </div>
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
