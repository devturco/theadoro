import { ReactNode, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@theadoro/ui';
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
  Ticket,
  Store,
  Megaphone
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
    title: 'Calendário',
    url: '/buyer/calendar',
    icon: Calendar,
  },
  {
    title: 'Minhas Listas',
    url: '/buyer/lists',
    icon: Gift,
  },
  {
    title: 'Agendamentos',
    url: '/buyer/appointments',
    icon: Clock,
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
    title: 'Cupons',
    url: '/seller/coupons',
    icon: Ticket,
  },
  {
    title: 'Campanhas',
    url: '/seller/campaigns',
    icon: Megaphone,
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
  }, [user?.id, profile?.id, roles, refreshProfile]);

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
  const isSellerRoute = location.pathname.startsWith('/seller');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {!isSellerRoute && <Header />}

      <main className={cn(
        "flex-1 container mx-auto px-4 py-8",
        !isSellerRoute ? "pt-32" : "pt-8"
      )}>
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
              <p className="text-xs text-muted-foreground mb-2">Membro desde {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}</p>

              {isSellerRoute ? (
                <div className="flex items-center gap-1 text-[10px] bg-wine/10 text-wine px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" />
                  Painel Administrativo
                </div>
              ) : (
                <>
                  {isSellerMode && !isAdmin && (
                    <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-1">
                      <ShieldCheck className="h-3 w-3" />
                      Conta Verificada
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      <User className="h-3 w-3" />
                      Cliente
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3" />
                      Admin Master
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              {/* Seller/Admin Tools Section */}
              {(isSellerRoute || isAdmin) && (
                <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {isAdmin ? 'Gestão Master' : 'Gestão de Loja'}
                    </span>
                  </div>
                  <div className="p-2 space-y-1">
                    {(isAdmin && !isSellerRoute ? [] : sellerMenuItems).map((item) => {
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
                    
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center justify-between p-3 rounded-lg text-purple-600 hover:bg-purple-50 transition-all group border border-dashed border-purple-100 mt-2"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-purple-400 group-hover:text-purple-600" />
                          <span className="font-bold">Painel Master</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )}
                  </div>
                </nav>
              )}

              {/* Buying Tools Section (Only for /buyer routes AND NOT for Admin) */}
              {!isSellerRoute && !isAdmin && (
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
                </nav>
              )}

              {/* General Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 space-y-1">
                {(isSellerRoute || isAdmin) ? (
                  <Link
                    to="/"
                    className="flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all font-medium"
                  >
                    <Store className="h-5 w-5 text-gray-400" />
                    <span>Ver Marketplace</span>
                  </Link>
                ) : isSellerMode && (
                  <Link
                    to="/seller/dashboard"
                    className="flex items-center gap-3 p-3 rounded-lg text-wine hover:bg-wine/5 transition-all font-medium"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Painel do Vendedor</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-all font-medium cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair da Conta</span>
                </button>
              </div>
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