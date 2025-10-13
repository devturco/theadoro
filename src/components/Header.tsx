import { useState } from "react";
import { Search, ShoppingBag, User, Heart, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar presentes, produtos, serviços..."
                className="pl-10 rounded-full border-2 border-muted focus:border-primary"
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
            </form>
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
