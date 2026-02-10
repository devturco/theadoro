import { ReactNode, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  Heart,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Clock,
  XCircle,
  Settings,
  Gift,
  Ticket
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

const sellerMenuItems = [
  {
    title: 'Painel Vendedor',
    url: '/seller/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Meus Produtos',
    url: '/seller/products',
    icon: ShoppingCart, // Using ShoppingCart for consistency or Package
  },
  {
    title: 'Vendas',
    url: '/seller/sales',
    icon: ShieldCheck,
  },
  {
    title: 'Relatórios',
    url: '/seller/reports',
    icon: LayoutDashboard, // Will use proper icons
  },
  {
    title: 'Insights & IA',
    url: '/seller/insights',
    icon: ShieldCheck,
  },
  {
    title: 'Embalagens',
    url: '/seller/gift-wraps',
    icon: Gift,
  },
  {
    title: 'Assinatura',
    url: '/seller/subscription',
    icon: Ticket,
  },
  {
    title: 'Configurações',
    url: '/seller/settings',
    icon: Settings,
  },
];

export const UserDashboardLayout = ({ children }: BuyerLayoutProps) => {
  const { signOut, profile, user, roles, refreshProfile } = useAuth();
  const location = useLocation();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkSellerStatus = async () => {
      const userId = user?.id || profile?.id;
      if (!userId) return;


      // Fast race for seller applications
      const fetchTask = (supabase.from as any)('seller_applications')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error('Status timeout')), 4000));

      try {
        const result: any = await Promise.race([fetchTask, timeoutTask]);
        const { data } = result;
        if (data) {
          setApplicationStatus(data.status);

          if (data.status === 'approved' && !roles.includes('seller')) {
            refreshProfile();
          }
        }
      } catch (reason) {
        console.warn('[UserDashboardLayout] Seller status check timed out or failed. Using cached context roles.');
        // If we timeout checking status, but the context ALREADY says we are a seller (from cache), 
        // we should just trust the context and stay in seller mode.
      }
    };

    if (user?.id || profile?.id) {
      checkSellerStatus();
    }
  }, [user?.id, profile?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth'; // Force redirect to be sure
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: Clear everything and redirect
      localStorage.clear();
      window.location.href = '/auth';
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || profile?.email?.split('@')[0] || 'Carregando...';

  // High-priority check: use both derived roles and raw dbRoles for the most reactive UI
  const isSellerMode = roles.includes('seller') || applicationStatus === 'approved';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pt-32">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Menu */}
          <aside className="w-full lg:w-64 space-y-6">
            {/* User Summary Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-champagne/20 flex items-center justify-center mb-4 border-2 border-champagne/30 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-champagne-dark" />
                )}
              </div>
              <h2 className="font-bold text-gray-900 line-clamp-1">{displayName}</h2>
              <p className="text-xs text-muted-foreground mb-4">Membro desde {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}</p>

              {isSellerMode && (
                <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" />
                  Conta Verificada
                </div>
              )}

              {applicationStatus === 'pending' && profile?.role !== 'seller' && (
                <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Aguardando Aprovação
                </div>
              )}

              {applicationStatus === 'rejected' && profile?.role !== 'seller' && (
                <div className="flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <XCircle className="h-3 w-3" />
                  Solicitação Reprovada
                </div>
              )}

              {!applicationStatus && profile?.role !== 'seller' && (
                <div className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <User className="h-3 w-3" />
                  Membro
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              {/* Seller Tools Section (Only for Sellers) */}
              {isSellerMode && (
                <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Painel do Vendedor</span>
                  </div>
                  <div className="p-2 space-y-1">
                    {sellerMenuItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <Link
                          key={item.title}
                          to={item.url}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg transition-all group",
                            isActive
                              ? "bg-wine text-white shadow-md shadow-wine/20"
                              : "text-gray-600 hover:bg-gray-50 hover:text-wine"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-wine")} />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", isActive ? "opacity-100" : "group-hover:opacity-100")} />
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              )}

              {/* Buying Tools Section (Always visible) */}
              <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Minha Conta</span>
                </div>
                <div className="p-2 space-y-1">
                  {buyerMenuItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all group",
                          isActive
                            ? "bg-wine text-white shadow-md shadow-wine/20"
                            : "text-gray-600 hover:bg-gray-50 hover:text-wine"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-wine")} />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", isActive ? "opacity-100" : "group-hover:opacity-100")} />
                      </Link>
                    );
                  })}
                </div>
                <div className="px-3 pb-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      refreshProfile();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg text-xs text-muted-foreground hover:bg-gray-50 transition-all font-medium border border-gray-100 border-dashed"
                  >
                    <Clock className="h-3 w-3" />
                    <span>Sincronizar Permissões</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-all font-medium cursor-pointer"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] overflow-hidden">
              <div className="p-6 md:p-8">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboardLayout;