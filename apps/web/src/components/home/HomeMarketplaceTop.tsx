import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  PackageCheck,
  ShoppingCart,
  TicketPercent,
  TrendingUp,
  UserRound,
  Wallet,
  X,
  Search,
  LogOut,
  LayoutDashboard,
  Heart,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useCategories";
import { useRole } from "@/hooks/useRole";
import heroImage from "@/assets/hero-gifts.jpg";
import { cn } from "@/lib/utils";

type ActionCard = {
  title: string;
  description: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const actionCards: ActionCard[] = [
  {
    title: "Frete gratis",
    description: "Confira ofertas com envio rapido para todo o Brasil.",
    cta: "Ver fretes",
    icon: PackageCheck,
    href: "/products",
  },
  {
    title: "Entre na sua conta",
    description: "Acompanhe pedidos, favoritos e ofertas exclusivas.",
    cta: "Entrar",
    icon: UserRound,
    href: "/auth",
  },
  {
    title: "Insira sua localizacao",
    description: "Melhore os prazos de entrega perto de voce.",
    cta: "Atualizar",
    icon: MapPin,
    href: "/buyer/profile",
  },
  {
    title: "Meios de pagamento",
    description: "Pague com seguranca no cartao, Pix ou boleto.",
    cta: "Ver opcoes",
    icon: Wallet,
    href: "/checkout",
  },
  {
    title: "Menos de R$100",
    description: "Selecao especial para presentear sem estourar o bolso.",
    cta: "Explorar",
    icon: BadgeDollarSign,
    href: "/offers",
  },
  {
    title: "Mais vendidos",
    description: "Produtos que estao em alta esta semana na plataforma.",
    cta: "Descobrir",
    icon: TrendingUp,
    href: "/products",
  },
];

const HomeMarketplaceTop = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { cartCount = 0 } = useCart() || {};
  const { categories } = useCategories();
  const { isAdmin, isSeller } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);

  const quickCategories = categories.slice(0, 6);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate("/auth");
  };

  const navAndClose = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <section
      className="pb-10 text-white"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--wine)) 0%, hsl(var(--wine)) 78%, hsl(var(--ivory)) 100%)",
      }}
    >
      <div className="container mx-auto px-3 sm:px-4 pt-4">
        <div className="rounded-2xl border border-white/15 bg-wine/80 px-3 sm:px-4 py-3 sm:py-4 shadow-lg backdrop-blur-sm">

          {/* ─── Mobile Header Row ─── */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>

            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img
                src="/logo-colors.png"
                alt="THEADORO"
                className="h-9 w-auto rounded-md bg-white px-2 py-1"
              />
            </Link>

            {/* Search — grows */}
            <form onSubmit={handleSearch} className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="h-9 w-full rounded-lg border border-white/20 bg-white/95 px-3 pr-10 text-sm text-gray-800 outline-none placeholder:text-gray-500 focus:border-white"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-wine p-1.5"
                aria-label="Buscar"
              >
                <Search className="h-3.5 w-3.5 text-white" />
              </button>
            </form>

            {/* Cart */}
            <button
              onClick={() => navigate("/cart")}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-h-[16px] min-w-[16px] rounded-full bg-white px-1 text-[9px] font-bold leading-[16px] text-wine">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* ─── Desktop Header Row ─── */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Link to="/" className="shrink-0">
                <img
                  src="/logo-colors.png"
                  alt="THEADORO"
                  className="h-11 w-auto rounded-md bg-white px-2 py-1"
                />
              </Link>

              <form onSubmit={handleSearch} className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar produtos, marcas e muito mais..."
                  className="h-11 w-full rounded-md border border-white/20 bg-white/95 px-4 pr-14 text-[15px] text-gray-800 outline-none ring-0 placeholder:text-gray-500 focus:border-white"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-wine px-3 py-2 text-xs font-semibold text-white transition hover:bg-wine-dark"
                >
                  Buscar
                </button>
              </form>

              <div className="hidden min-w-[180px] rounded-full border border-white/20 bg-white/10 px-4 py-2 text-center text-sm font-semibold md:block">
                THEADORO+
              </div>
            </div>

            {/* Desktop Nav Row */}
            <div className="flex flex-col gap-3 border-t border-white/15 pt-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                <span className="flex items-center gap-1 font-medium text-white/95">
                  <MapPin className="h-4 w-4" />
                  Enviar para Sao Paulo
                </span>
                <span className="inline-flex items-center gap-1 text-white/90">
                  Categorias
                  <ChevronDown className="h-4 w-4" />
                </span>
                {quickCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/categories/${category.slug}`}
                    className="text-white/90 transition hover:text-white"
                  >
                    {category.name}
                  </Link>
                ))}
                <Link to="/offers" className="text-white/90 transition hover:text-white">
                  Ofertas
                </Link>
                <Link to="/coupons" className="inline-flex items-center gap-1 text-white/90 transition hover:text-white">
                  <TicketPercent className="h-4 w-4" />
                  Cupons
                </Link>
              </div>

              <div className="flex items-center gap-5 text-[14px]">
                {!user && (
                  <Link to="/auth?mode=register" className="text-white/90 transition hover:text-white">
                    Crie a sua conta
                  </Link>
                )}
                {!user && (
                  <Link to="/auth" className="text-white/90 transition hover:text-white">
                    Entre
                  </Link>
                )}
                <Link
                  to={user ? "/buyer/orders" : "/auth"}
                  className="text-white/90 transition hover:text-white"
                >
                  Compras
                </Link>
                <button
                  onClick={() => navigate("/cart")}
                  className="relative transition hover:opacity-90"
                  aria-label="Abrir carrinho"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 min-h-[18px] min-w-[18px] rounded-full bg-white px-1 text-[10px] font-bold leading-[18px] text-wine">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero + Action cards (unchanged layout) */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div
            className="relative min-h-[220px] sm:min-h-[280px] overflow-hidden rounded-2xl border border-white/20"
            style={{
              backgroundImage: `linear-gradient(120deg, hsl(var(--graphite) / 0.88), hsl(var(--wine) / 0.62)), url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="relative z-10 max-w-xl p-6 sm:p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                Semana 15.3
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Ofertas imperdiveis
              </h1>
              <p className="mt-3 text-base sm:text-lg text-white/85">
                Ate <strong>70% OFF</strong> em presentes, kits e experiencias.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/offers")}
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold text-wine transition hover:bg-champagne-dark"
                >
                  Ver promocoes
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-white/80">
                Oferta relampago
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-bold">Por R$129,90</p>
              <p className="mt-1 text-sm text-white/85">Selecao de presentes com envio rapido.</p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-white/80">
                Com cupom
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-bold">Ate R$164,90 OFF</p>
              <p className="mt-1 text-sm text-white/85">Use cupons exclusivos da THEADORO.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {actionCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-xl bg-white p-3 sm:p-4 text-gray-800 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-sm sm:text-[18px] font-semibold text-gray-900">{card.title}</p>
              <card.icon className="my-2 sm:my-3 h-7 w-7 sm:h-9 sm:w-9 text-wine" />
              <p className="hidden sm:block min-h-[52px] text-sm text-gray-600">{card.description}</p>
              <span className="mt-2 sm:mt-4 inline-flex rounded-md bg-wine/10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-wine">
                {card.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Mobile Drawer ─── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 z-[70] w-[85vw] max-w-[300px] bg-wine-dark flex flex-col lg:hidden animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/15">
              <img src="/logo-colors.png" alt="THEADORO" className="h-9 w-auto rounded-md bg-white px-2 py-1" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {/* User info or auth */}
              {user ? (
                <div className="mb-4 p-3 bg-white/10 rounded-xl">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Olá,</p>
                  <p className="font-bold text-white truncate">{profile?.full_name || user.email}</p>
                </div>
              ) : (
                <div className="mb-4 flex flex-col gap-2">
                  <button onClick={() => navAndClose("/auth")} className="w-full py-2.5 px-4 bg-white text-wine font-bold rounded-lg text-sm">
                    Entrar
                  </button>
                  <button onClick={() => navAndClose("/auth?mode=register")} className="w-full py-2.5 px-4 border border-white/30 text-white font-medium rounded-lg text-sm">
                    Criar conta
                  </button>
                </div>
              )}

              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-1 pt-2 pb-1">Navegar</p>

              {/* Categorias */}
              <button
                onClick={() => setMobileCatsOpen((v) => !v)}
                className="w-full flex items-center justify-between p-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors font-medium text-sm"
              >
                <span>Categorias</span>
                <ChevronRight className={cn("h-4 w-4 text-white/50 transition-transform", mobileCatsOpen && "rotate-90")} />
              </button>
              {mobileCatsOpen && (
                <div className="ml-4 space-y-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navAndClose(`/categories/${cat.slug}`)}
                      className="w-full text-left p-2 text-sm text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {[
                { label: "Ofertas", path: "/offers" },
                { label: "Cupons", path: "/coupons" },
                { label: "Produtos", path: "/products" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navAndClose(item.path)}
                  className="w-full flex items-center p-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors font-medium text-sm text-left"
                >
                  {item.label}
                </button>
              ))}

              {/* Account links */}
              {user && (
                <>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-1 pt-4 pb-1">Minha Conta</p>
                  {isAdmin && (
                    <button onClick={() => navAndClose("/admin/dashboard")} className="w-full flex items-center gap-3 p-3 rounded-lg text-white/90 hover:bg-white/10 text-sm font-medium text-left">
                      <LayoutDashboard className="h-4 w-4" /> Painel Admin
                    </button>
                  )}
                  {isSeller && (
                    <button onClick={() => navAndClose("/seller/dashboard")} className="w-full flex items-center gap-3 p-3 rounded-lg text-white/90 hover:bg-white/10 text-sm font-medium text-left">
                      <LayoutDashboard className="h-4 w-4" /> Painel Vendedor
                    </button>
                  )}
                  <button onClick={() => navAndClose("/buyer/dashboard")} className="w-full flex items-center gap-3 p-3 rounded-lg text-white/90 hover:bg-white/10 text-sm font-medium text-left">
                    <LayoutDashboard className="h-4 w-4" /> Meu Painel
                  </button>
                  <button onClick={() => navAndClose("/buyer/orders")} className="w-full flex items-center gap-3 p-3 rounded-lg text-white/90 hover:bg-white/10 text-sm font-medium text-left">
                    <ShoppingCart className="h-4 w-4" /> Minhas Compras
                  </button>
                  <button onClick={() => navAndClose("/buyer/wishlist")} className="w-full flex items-center gap-3 p-3 rounded-lg text-white/90 hover:bg-white/10 text-sm font-medium text-left">
                    <Heart className="h-4 w-4" /> Lista de Desejos
                  </button>
                  <button onClick={() => navAndClose("/buyer/profile")} className="w-full flex items-center gap-3 p-3 rounded-lg text-white/90 hover:bg-white/10 text-sm font-medium text-left">
                    <Settings className="h-4 w-4" /> Meu Perfil
                  </button>
                </>
              )}

              {!isAdmin && !isSeller && (
                <div className="pt-4">
                  <button
                    onClick={() => navAndClose("/seller/onboarding")}
                    className="w-full py-3 px-4 bg-white text-wine font-bold rounded-xl text-sm"
                  >
                    Vender na THEADORO
                  </button>
                </div>
              )}
            </div>

            {user && (
              <div className="p-3 border-t border-white/15">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-300 hover:bg-red-900/30 transition-colors font-medium text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default HomeMarketplaceTop;
