import { Search, ShoppingBag, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gradient-wine">THEADORO</h1>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar presentes, produtos, serviços..."
                className="pl-10 rounded-full border-2 border-muted focus:border-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                0
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="wine" className="hidden lg:flex">
              Vender na THEADORO
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex h-12 items-center space-x-8 text-sm font-medium border-t">
          <Link to="/presentes" className="hover:text-primary transition-colors">
            Presentes
          </Link>
          <Link to="/flores" className="hover:text-primary transition-colors">
            Flores & Cestas
          </Link>
          <Link to="/moda" className="hover:text-primary transition-colors">
            Moda
          </Link>
          <Link to="/beleza" className="hover:text-primary transition-colors">
            Beleza & Bem-estar
          </Link>
          <Link to="/servicos" className="hover:text-primary transition-colors">
            Serviços
          </Link>
          <Link to="/experiencias" className="hover:text-primary transition-colors">
            Experiências
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
