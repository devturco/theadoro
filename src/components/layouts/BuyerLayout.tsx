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
  ShoppingCart, 
  Calendar, 
  Heart, 
  User, 
  LogOut,
  Gift
} from 'lucide-react';

interface BuyerLayoutProps {
  children?: ReactNode;
}

const buyerMenuItems = [
  {
    title: 'Dashboard',
    url: '/buyer/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Meus Pedidos',
    url: '/buyer/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Agendamentos',
    url: '/buyer/appointments',
    icon: Calendar,
  },
  {
    title: 'Lista de Desejos',
    url: '/buyer/wishlist',
    icon: Heart,
  },
  {
    title: 'Perfil',
    url: '/buyer/profile',
    icon: User,
  },
];

export const BuyerLayout = ({ children }: BuyerLayoutProps) => {
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
              <span className="font-bold text-lg">THEADORO</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Comprador</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {buyerMenuItems.map((item) => (
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
                {profile?.full_name || 'Comprador'}
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
              <h1 className="text-xl font-semibold">Minha Conta</h1>
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

export default BuyerLayout;