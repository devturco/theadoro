import { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, Heart, LogOut, Settings, LayoutDashboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
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
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Try to use cart and wishlist hooks, but handle gracefully if not available
  let cartItemCount = 0;
  let wishlistItemCount = 0;

  try {
    const { getCartSummary } = useCart();
    cartItemCount = getCartSummary().itemCount;
  } catch (error) {
    // Cart context not available
  }

  try {
    const { items } = useWishlist();
    wishlistItemCount = items.length;
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

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/logo-colors.png"
              alt="THEADORO"
              className="h-12 w-auto"
            />
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar presentes, produtos, serviços..."
                className="pl-10 rounded-full border-2 border-muted focus:border-primary"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (searchQuery.trim().length >= 3) setShowSuggestions(true);
                }}
              />
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                {loadingSuggestions ? (
                  <div className="p-4 flex justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Buscando...
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul>
                    {suggestions.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={`/product/${item.slug || item.id}`}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <ShoppingBag className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{(item.category as any)?.name}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                    <li className="border-t border-gray-100">
                      <button
                        className="w-full text-left px-4 py-3 text-sm text-primary font-medium hover:bg-gray-50 flex items-center"
                        onClick={() => {
                          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                          setShowSuggestions(false);
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Ver todos os resultados para "{searchQuery}"
                      </button>
                    </li>
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/wishlist')}
            >
              <Heart className="h-5 w-5" />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {wishlistItemCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/auth')}>
                <User className="h-5 w-5" />
              </Button>
            )}
            <Button variant="wine" className="hidden lg:flex">
              Vender na THEADORO
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex h-12 items-center space-x-8 text-sm font-medium border-t">
          <Link to="/products" className="hover:text-primary transition-colors">
            Todos os Produtos
          </Link>
          <Link to="/categories" className="hover:text-primary transition-colors">
            Categorias
          </Link>
          <Link to="/categories/presentes" className="hover:text-primary transition-colors">
            Presentes
          </Link>
          <Link to="/categories/flores" className="hover:text-primary transition-colors">
            Flores & Cestas
          </Link>
          <Link to="/categories/moda" className="hover:text-primary transition-colors">
            Moda
          </Link>
          <Link to="/categories/beleza" className="hover:text-primary transition-colors">
            Beleza & Bem-estar
          </Link>
          <Link to="/categories/servicos" className="hover:text-primary transition-colors">
            Serviços
          </Link>
          <Link to="/categories/experiencias" className="hover:text-primary transition-colors">
            Experiências
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
