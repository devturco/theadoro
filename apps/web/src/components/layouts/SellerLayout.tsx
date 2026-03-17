import { ReactNode } from 'react';
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
  Package,
  ShoppingBag,
  Calendar,
  BarChart3,
  LogOut,
  Gift,
  Ticket,
  Megaphone,
  Settings,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';

interface SellerLayoutProps {
  children?: ReactNode;
}

const sellerMenuItems = [
  { title: 'Dashboard', url: '/seller/dashboard', icon: LayoutDashboard },
  { title: 'Produtos', url: '/seller/products', icon: Package },
  { title: 'Vendas', url: '/seller/sales', icon: ShoppingBag },
  { title: 'Agendamentos', url: '/seller/appointments', icon: Calendar },
  { title: 'Relatórios', url: '/seller/reports', icon: BarChart3 },
  { title: 'Insights & IA', url: '/seller/insights', icon: Sparkles },
  { title: 'Embalagens', url: '/seller/gift-wraps', icon: Gift },
  { title: 'Assinatura', url: '/seller/subscription', icon: Ticket },
  { title: 'Cupons', url: '/seller/coupons', icon: Ticket },
  { title: 'Campanhas', url: '/seller/campaigns', icon: Megaphone },
  { title: 'Configurações', url: '/seller/settings', icon: Settings },
];

export const SellerLayout = ({ children }: SellerLayoutProps) => {
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
              <span className="font-bold text-base">THEADORO Seller</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Vendedor</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sellerMenuItems.map((item) => (
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
                {profile?.full_name || 'Vendedor'}
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
                <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Painel do Vendedor</h1>
                <p className="text-sm text-gray-500">Gestão da sua loja na THEADORO</p>
              </div>
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SellerLayout;