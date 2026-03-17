import { ReactNode, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Settings,
  Gift,
  Ticket,
  Store,
  Megaphone,
  Menu,
  X,
  Package,
  PanelLeft
} from 'lucide-react';

interface BuyerLayoutProps {
  children?: ReactNode;
}

const buyerMenuItems = [
  { title: 'Dashboard', url: '/buyer/dashboard', icon: LayoutDashboard },
  { title: 'Meus Pedidos', url: '/buyer/orders', icon: ShoppingCart },
  { title: 'Calendário', url: '/buyer/calendar', icon: Calendar },
  { title: 'Minhas Listas', url: '/buyer/lists', icon: Gift },
  { title: 'Agendamentos', url: '/buyer/appointments', icon: Clock },
  { title: 'Lista de Desejos', url: '/buyer/wishlist', icon: Heart },
  { title: 'Perfil', url: '/buyer/profile', icon: User },
];

const sellerMenuItems = [
  { title: 'Painel Vendedor', url: '/seller/dashboard', icon: LayoutDashboard },
  { title: 'Meus Produtos', url: '/seller/products', icon: Package },
  { title: 'Vendas', url: '/seller/sales', icon: ShoppingCart },
  { title: 'Relatórios', url: '/seller/reports', icon: LayoutDashboard },
  { title: 'Insights & IA', url: '/seller/insights', icon: ShieldCheck },
  { title: 'Embalagens', url: '/seller/gift-wraps', icon: Gift },
  { title: 'Assinatura', url: '/seller/subscription', icon: Ticket },
  { title: 'Cupons', url: '/seller/coupons', icon: Ticket },
  { title: 'Campanhas', url: '/seller/campaigns', icon: Megaphone },
  { title: 'Configurações', url: '/seller/settings', icon: Settings },
];

export const UserDashboardLayout = ({ children }: BuyerLayoutProps) => {
  const { signOut, profile, user, roles, refreshProfile } = useAuth();
  const location = useLocation();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSellerRoute, setIsSellerRoute] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    setIsSellerRoute(location.pathname.startsWith('/seller'));
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const checkSellerStatus = async () => {
      const userId = user?.id || profile?.id;
      if (!userId) return;

      const fetchTask = (supabase.from as any)('seller_applications')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      const timeoutTask = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Status timeout')), 4000)
      );

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
        // silent fail
      }
    };

    if (user?.id || profile?.id) {
      checkSellerStatus();
    }
  }, [user?.id, profile?.id, roles, refreshProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      localStorage.clear();
      window.location.href = '/auth';
    }
  };

  const displayName =
    profile?.full_name ||
    user?.email?.split('@')[0] ||
    profile?.email?.split('@')[0] ||
    'Carregando...';

  const isAdmin = roles.includes('admin');
  const isSellerMode = roles.includes('seller') || applicationStatus === 'approved';

  // Build the nav items to show
  const navItems = isSellerRoute || isAdmin ? sellerMenuItems : buyerMenuItems;
  const sectionLabel = isAdmin ? 'Gestão Master' : isSellerRoute ? 'Gestão de Loja' : 'Minha Conta';

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Summary Card */}
      <div className="p-4 flex flex-col items-center text-center border-b border-gray-100">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 flex items-center justify-center mb-3 border-2 border-amber-100 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="h-8 w-8 sm:h-10 sm:h-10 text-amber-600" />
          )}
        </div>
        <h2 className="font-bold text-gray-900 text-sm line-clamp-1">{displayName}</h2>
        <p className="text-[10px] text-muted-foreground mb-2">
          Membro desde {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
        </p>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> Admin Master
          </span>
        )}
        {!isAdmin && isSellerMode && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> Conta Verificada
          </span>
        )}
        {!isAdmin && !isSellerMode && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <User className="h-3 w-3" /> Cliente
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Main nav section */}
        <nav className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-50">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sectionLabel}</span>
          </div>
          <div className="p-2 space-y-0.5">
            {(isAdmin && !isSellerRoute ? [] : navItems).map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg transition-all group',
                    isActive
                      ? 'bg-wine text-white shadow-md shadow-wine/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-wine'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-400 group-hover:text-wine')} />
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  <ChevronRight className={cn('h-3.5 w-3.5 opacity-0 transition-opacity', isActive ? 'opacity-100' : 'group-hover:opacity-100')} />
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center justify-between p-2.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-all group border border-dashed border-purple-100 mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-purple-400 group-hover:text-purple-600" />
                  <span className="font-bold text-sm">Painel Master</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </div>
        </nav>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-2 space-y-0.5">
          {(isSellerRoute || isAdmin) ? (
            <Link
              to="/"
              className="flex items-center gap-2.5 p-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-all font-medium text-sm"
            >
              <Store className="h-4 w-4 text-gray-400" />
              <span>Ver Marketplace</span>
            </Link>
          ) : isSellerMode && (
            <Link
              to="/seller/dashboard"
              className="flex items-center gap-2.5 p-2.5 rounded-lg text-wine hover:bg-wine/5 transition-all font-medium text-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Painel do Vendedor</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all font-medium text-sm cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className={cn(
        'flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-24 sm:pt-28 lg:pt-32'
      )}>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-28">
              <SidebarContent />
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile Sidebar Overlay */}
      {
        mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 bottom-0 z-[70] w-[85vw] max-w-[300px] bg-white shadow-2xl flex flex-col lg:hidden animate-in slide-in-from-left duration-300">
              {/* Close button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-bold text-gray-900 text-sm">Menu do Painel</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarContent />
              </div>
            </div>
          </>
        )
      }
    </div >
  );
};

export default UserDashboardLayout;
