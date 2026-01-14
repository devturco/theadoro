import { ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  Heart,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck
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
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!profile?.id) return;

      // Check if already a seller
      if (profile.role === 'seller') {
        setApplicationStatus('approved');
        return;
      }

      const { data } = await supabase
        .from('seller_applications')
        .select('status')
        .eq('user_id', profile.id)
        .maybeSingle(); // Use maybeSingle to avoid 406 error if none found

      if (data) {
        setApplicationStatus(data.status);
      }
    };

    checkSellerStatus();
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
                  <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-champagne-dark" />
                )}
              </div>
              <h2 className="font-bold text-gray-900 line-clamp-1">{profile?.full_name || 'Comprador'}</h2>
              <p className="text-xs text-muted-foreground mb-4">Membro desde {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}</p>

              {applicationStatus === 'approved' && (
                <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" />
                  Conta Verificada
                </div>
              )}

              {applicationStatus === 'pending' && (
                <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Aguardando Aprovação
                </div>
              )}

              {applicationStatus === 'rejected' && (
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
              <div className="p-2 mt-4 border-t border-gray-50">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-all font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </nav>
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

export default BuyerLayout;