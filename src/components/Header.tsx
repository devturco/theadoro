import { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, Heart, LogOut, Settings, LayoutDashboard, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useRole } from "@/hooks/useRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isAdmin, isSeller } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Try to use cart and wishlist hooks, but handle gracefully if not available
  let cartItemCount = 0;
  let wishlistItemCount = 0;

  try {
    const { cartCount } = useCart();
    cartItemCount = cartCount;
  } catch (error) {
    // Cart context not available
  }

  try {
    const { wishlist } = useWishlist() as any;
    wishlistItemCount = wishlist?.length || 0;
  } catch (error) {
    // Wishlist context not available
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, image_url, category:categories(name)')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq('is_active', true)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-4">

        {/* Top Row: Logo, Search, Sell Button */}
        <div className="flex h-16 items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-colors.png" alt="THEADORO" className="h-12 w-auto" />
          </Link>

          {/* Search Bar - Dominate Space */}
          <div className="flex-1 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-wine transition-colors" />
              <Input
                type="text"
                placeholder="Buscar produtos, marcas e muito mais..."
                className="w-full pl-10 pr-12 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-wine focus:ring-1 focus:ring-wine rounded-lg shadow-sm transition-all text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchChange(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {loadingSuggestions && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                <Button type="submit" variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 z-50">
                {suggestions.map((item: any) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                    onClick={() => {
                      navigate(item.type === 'category' ? `/category/${item.slug}` : `/product/${item.slug}`);
                      setShowSuggestions(false);
                      setSearchQuery("");
                    }}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-10 w-10 object-cover rounded-md" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{item.type === 'category' ? 'Categoria' : 'Produto'}</p>
                    </div>
                    <Search className="h-4 w-4 text-gray-300 group-hover:text-wine" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sell Button - ML Style Positioning */}
          {!isAdmin && !isSeller && (
            <Button
              variant="wine"
              className="hidden md:flex gap-2 h-10 font-bold px-5 shadow-sm hover:shadow-md transition-all text-sm"
              onClick={() => navigate('/seller/onboarding')}
            >
              Vender na THEADORO
            </Button>
          )}
        </div>

        {/* Bottom Row: Navigation, Account Links, Cart */}
        <div className="flex h-10 items-center justify-between border-t border-gray-50">

          {/* Main Navigation */}
          <nav className="flex items-center gap-6 text-[13px] font-medium text-gray-600">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-wine transition-colors outline-none font-semibold">
                Categorias <ChevronDown className="h-4 w-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2 rounded-xl shadow-xl mt-1">
                <DropdownMenuItem className="p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine" onClick={() => navigate('/category/flores')}>Flores & Cestas</DropdownMenuItem>
                <DropdownMenuItem className="p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine" onClick={() => navigate('/category/joias')}>Joias & Acessórios</DropdownMenuItem>
                <DropdownMenuItem className="p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine" onClick={() => navigate('/category/moda')}>Moda & Estilo</DropdownMenuItem>
                <DropdownMenuItem className="p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine" onClick={() => navigate('/category/cestas')}>Experiências</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/offers" className="hover:text-wine transition-colors">Ofertas</Link>
            <Link to="/coupons" className="hover:text-wine transition-colors">Cupons</Link>
            <Link to="/about" className="hover:text-wine transition-colors hidden sm:block">A THEADORO</Link>
            <Link to="/contact" className="hover:text-wine transition-colors hidden sm:block">Contato</Link>
          </nav>

          {/* User Actions & Cart */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[13px] font-medium text-gray-700">
              {!user ? (
                <>
                  <Link to="/auth?mode=register" className="hover:text-wine transition-colors">Crie a sua conta</Link>
                  <Link to="/auth" className="hover:text-wine transition-colors">Entre</Link>
                </>
              ) : (
                <>
                  <Link to="/buyer/orders" className="hover:text-wine transition-colors">Compras</Link>

                  {/* Minha Conta Profile Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-wine transition-all group outline-none">
                        <span className="hidden sm:inline-block">Minha Conta</span>
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-wine transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 p-2 rounded-xl shadow-xl border-gray-100 mt-1">
                      <div className="px-3 py-4 mb-2 bg-gray-50/50 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Logado como</p>
                        <p className="font-bold text-gray-900 truncate text-sm">{profile?.full_name || user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="my-1" />
                      {profile?.role === 'admin' && (
                        <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate('/admin/dashboard')}>
                          <LayoutDashboard className="h-4 w-4" />
                          <span className="font-medium">Painel Admin</span>
                        </DropdownMenuItem>
                      )}
                      {profile?.role === 'seller' && (
                        <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate('/seller/dashboard')}>
                          <LayoutDashboard className="h-4 w-4" />
                          <span className="font-medium">Painel Vendedor</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate('/buyer/dashboard')}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="font-medium">Meu Painel</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate('/buyer/wishlist')}>
                        <Heart className="h-4 w-4" />
                        <span className="font-medium">Lista de Desejos</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate('/buyer/profile')}>
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">Meu Perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:text-red-600 hover:bg-red-50 text-gray-600" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Cart Icon */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-transparent h-8 w-8"
              onClick={() => navigate('/cart')}
            >
              <ShoppingBag className="h-6 w-6 text-gray-700 hover:text-wine transition-colors" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 min-w-[18px] min-h-[18px] rounded-full bg-wine text-white text-[9px] font-bold flex items-center justify-center shadow-sm border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
