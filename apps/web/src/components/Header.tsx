import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  LogOut,
  Settings,
  LayoutDashboard,
  Loader2,
  ChevronDown,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@theadoro/ui";
import { Input } from "@theadoro/ui";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useRole } from "@/hooks/useRole";
import { useCategories } from "@/hooks/useCategories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@theadoro/ui";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isAdmin, isSeller } = useRole();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
  const [mobileSellerOpen, setMobileSellerOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { cartCount = 0 } = useCart() || {};
  const { wishlist = [] } = (useWishlist() as any) || {};

  const cartItemCount = cartCount;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

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
          .from("products")
          .select("id, name, slug, image_url, category:categories(name)")
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq("is_active", true)
          .limit(5);
        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.trim().length >= 3);
  };

  const navigateAndClose = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const { getSettingValue } = useSiteSettings("general");
  const isMaintenanceMode = getSettingValue("maintenance_mode", false);
  const showMaintenanceBanner = isMaintenanceMode && isAdmin;

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 z-50 bg-white border-b border-gray-100 transition-all duration-300",
          showMaintenanceBanner ? "top-8" : "top-0"
        )}
      >
        <div className="container mx-auto px-3 sm:px-4">

          {/* ─── Mobile Row ─── */}
          <div className="flex md:hidden h-14 items-center gap-2">
            {/* Hambúrguer */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-1 flex items-center">
              <img src="/logo-colors.png" alt="THEADORO" className="h-9 w-auto" />
            </Link>

            {/* Ações rápidas */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Pesquisar"
              >
                <Search className="h-5 w-5 text-gray-700" />
              </button>
              <button
                className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => navigateAndClose("/cart")}
                aria-label="Carrinho"
              >
                <ShoppingBag className="h-5 w-5 text-gray-700" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-wine text-white text-[9px] font-bold flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ─── Mobile Search Bar (expandable) ─── */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-2" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  autoFocus
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full pl-9 pr-10 h-10 bg-gray-50 border-gray-200 focus:border-wine focus:ring-1 focus:ring-wine rounded-lg text-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </form>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-3 right-3 bg-white border border-gray-100 rounded-lg shadow-2xl overflow-hidden z-50 mt-1">
                  {suggestions.map((item: any) => (
                    <button
                      key={item.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => {
                        navigate(`/product/${item.slug}`);
                        setMobileSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-8 w-8 object-cover rounded-md" />
                      ) : (
                        <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <Search className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                      <p className="font-medium text-sm text-gray-900 flex-1">{item.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Desktop Top Row ─── */}
          <div className="hidden md:flex h-16 items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo-colors.png" alt="THEADORO" className="h-12 w-auto" />
            </Link>

            {/* Search Bar */}
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
                        navigate(`/product/${item.slug}`);
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
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Produto</p>
                      </div>
                      <Search className="h-4 w-4 text-gray-300 group-hover:text-wine" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sell Button */}
            {!isAdmin && !isSeller && (
              <Button
                variant="wine"
                className="hidden md:flex gap-2 h-10 font-bold px-5 shadow-sm hover:shadow-md transition-all text-sm"
                onClick={() => navigate("/seller/onboarding")}
              >
                Vender na THEADORO
              </Button>
            )}
          </div>

          {/* ─── Desktop Bottom Row ─── */}
          <div className="hidden md:flex h-10 items-center justify-between border-t border-gray-50">
            {/* Main Navigation */}
            <nav className="flex items-center gap-6 text-[13px] font-medium text-gray-600">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-wine transition-colors outline-none font-semibold">
                  Categorias <ChevronDown className="h-4 w-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-2 rounded-xl shadow-xl mt-1">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        className="p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine"
                        onClick={() => navigate(`/categories/${category.slug}`)}
                      >
                        {category.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-gray-400 text-center italic">Carregando...</div>
                  )}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:text-wine transition-all group outline-none">
                          <div className="flex flex-col items-end mr-1">
                            <span className="text-[10px] text-gray-400 leading-none">Olá,</span>
                            <span className="font-bold text-gray-900 truncate max-w-[100px] leading-tight">
                              {profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                            </span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-wine transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60 p-2 rounded-xl shadow-xl border-gray-100 mt-1">
                        <div className="px-3 py-4 mb-2 bg-gray-50/50 rounded-lg">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Logado como</p>
                          <p className="font-bold text-gray-900 truncate text-sm">{profile?.full_name || user.email}</p>
                        </div>
                        <DropdownMenuSeparator className="my-1" />
                        {isAdmin && (
                          <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate("/admin/dashboard")}>
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="font-medium">Painel Admin</span>
                          </DropdownMenuItem>
                        )}
                        {isSeller && (
                          <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate("/seller/dashboard")}>
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="font-medium">Painel Vendedor</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate("/buyer/dashboard")}>
                          <LayoutDashboard className="h-4 w-4" />
                          <span className="font-medium">Meu Painel</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate("/buyer/wishlist")}>
                          <Heart className="h-4 w-4" />
                          <span className="font-medium">Lista de Desejos</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-wine/5 hover:text-wine transition-colors" onClick={() => navigate("/buyer/profile")}>
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
                onClick={() => navigate("/cart")}
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

      {/* ─── Mobile Drawer Menu ─── */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 left-0 bottom-0 z-[70] w-[85vw] max-w-[320px] bg-white shadow-2xl flex flex-col md:hidden animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <img src="/logo-colors.png" alt="THEADORO" className="h-9 w-auto" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {/* User info or auth links */}
              {user ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Olá,</p>
                  <p className="font-bold text-gray-900 truncate">{profile?.full_name || user.email}</p>
                </div>
              ) : (
                <div className="mb-4 flex flex-col gap-2">
                  <button
                    onClick={() => navigateAndClose("/auth")}
                    className="w-full py-2.5 px-4 bg-wine text-white font-bold rounded-lg text-sm"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => navigateAndClose("/auth?mode=register")}
                    className="w-full py-2.5 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg text-sm"
                  >
                    Criar conta
                  </button>
                </div>
              )}

              {/* Navigation */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 pt-2 pb-1">Navegar</p>

              {/* Categorias collapsible */}
              <button
                onClick={() => setMobileCatsOpen((v) => !v)}
                className="w-full flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <span>Categorias</span>
                <ChevronRight className={cn("h-4 w-4 text-gray-400 transition-transform", mobileCatsOpen && "rotate-90")} />
              </button>
              {mobileCatsOpen && (
                <div className="ml-4 space-y-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navigateAndClose(`/categories/${cat.slug}`)}
                      className="w-full text-left p-2.5 text-sm text-gray-600 hover:text-wine hover:bg-wine/5 rounded-lg transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {[
                { label: "Ofertas", path: "/offers" },
                { label: "Cupons", path: "/coupons" },
                { label: "A THEADORO", path: "/about" },
                { label: "Contato", path: "/contact" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateAndClose(item.path)}
                  className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-left"
                >
                  {item.label}
                </button>
              ))}

              {/* Account links (when logged in) */}
              {user && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 pt-4 pb-1">Gestão</p>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setMobileAdminOpen((v) => !v)}
                        className="w-full flex items-center justify-between p-3 rounded-lg text-purple-700 bg-purple-50/50 hover:bg-purple-50 transition-colors font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <LayoutDashboard className="h-5 w-5" />
                          <span>Administração</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-purple-400 transition-transform", mobileAdminOpen && "rotate-90")} />
                      </button>
                      {mobileAdminOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-purple-100 pl-2">
                          {[
                            { title: 'Dashboard', url: '/admin/dashboard' },
                            { title: 'Usuários', url: '/admin/users' },
                            { title: 'Aprovações', url: '/admin/approvals' },
                            { title: 'Produtos', url: '/admin/products' },
                            { title: 'Pedidos', url: '/admin/orders' },
                            { title: 'Categorias', url: '/admin/categories' },
                          ].map((item) => (
                            <button
                              key={item.url}
                              onClick={() => navigateAndClose(item.url)}
                              className="w-full text-left p-2.5 text-sm text-purple-600/80 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {isSeller && (
                    <>
                      <button
                        onClick={() => setMobileSellerOpen((v) => !v)}
                        className="w-full flex items-center justify-between p-3 rounded-lg text-wine bg-wine/5 hover:bg-wine/10 transition-colors font-bold mt-1"
                      >
                        <div className="flex items-center gap-3">
                          <LayoutDashboard className="h-5 w-5" />
                          <span>Minha Loja</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-wine/40 transition-transform", mobileSellerOpen && "rotate-90")} />
                      </button>
                      {mobileSellerOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-wine/10 pl-2">
                          {[
                            { title: 'Dashboard', url: '/seller/dashboard' },
                            { title: 'Meus Produtos', url: '/seller/products' },
                            { title: 'Minhas Vendas', url: '/seller/sales' },
                            { title: 'Cupons', url: '/seller/coupons' },
                            { title: 'Relatórios', url: '/seller/reports' },
                            { title: 'Configurações', url: '/seller/settings' },
                          ].map((item) => (
                            <button
                              key={item.url}
                              onClick={() => navigateAndClose(item.url)}
                              className="w-full text-left p-2.5 text-sm text-wine/80 hover:text-wine hover:bg-wine/5 rounded-lg transition-colors"
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={() => navigateAndClose("/buyer/dashboard")} className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-left mt-1">
                    <LayoutDashboard className="h-5 w-5 text-gray-400" />
                    Meu Painel
                  </button>
                  <button onClick={() => navigateAndClose("/buyer/orders")} className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-left">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                    Minhas Compras
                  </button>
                  <button onClick={() => navigateAndClose("/buyer/wishlist")} className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-left">
                    <Heart className="h-5 w-5 text-gray-400" />
                    Lista de Desejos
                  </button>
                  <button onClick={() => navigateAndClose("/buyer/profile")} className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-left">
                    <Settings className="h-5 w-5 text-gray-400" />
                    Meu Perfil
                  </button>
                </>
              )}

              {/* Sell CTA */}
              {!isAdmin && !isSeller && (
                <div className="pt-4">
                  <button
                    onClick={() => navigateAndClose("/seller/onboarding")}
                    className="w-full py-3 px-4 bg-wine text-white font-bold rounded-xl text-sm"
                  >
                    Vender na THEADORO
                  </button>
                </div>
              )}
            </div>

            {/* Sign out */}
            {user && (
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Sair da Conta
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Header;
