import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  ChevronDown,
  MapPin,
  PackageCheck,
  ShoppingCart,
  TicketPercent,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useCategories";
import heroImage from "@/assets/hero-gifts.jpg";

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
  const { user } = useAuth();
  const { cartCount = 0 } = useCart() || {};
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");

  const quickCategories = categories.slice(0, 6);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <section
      className="pb-10 text-white"
      style={{
        background:
          "linear-gradient(180deg, #760a0f 0%, #760a0f 78%, #f2f2f2 100%)",
      }}
    >
      <div className="container mx-auto px-4 pt-4">
        <div className="rounded-2xl border border-white/15 bg-[#760a0f]/80 px-4 py-4 shadow-lg backdrop-blur-sm">
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[#760a0f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5f080c]"
              >
                Buscar
              </button>
            </form>

            <div className="hidden min-w-[180px] rounded-full border border-white/20 bg-white/10 px-4 py-2 text-center text-sm font-semibold md:block">
              THEADORO+
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/15 pt-3 lg:flex-row lg:items-center lg:justify-between">
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
                  <span className="absolute -right-2 -top-2 min-h-[18px] min-w-[18px] rounded-full bg-white px-1 text-[10px] font-bold leading-[18px] text-[#760a0f]">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div
            className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/20"
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(17, 2, 4, 0.88), rgba(118, 10, 15, 0.62)), url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="relative z-10 max-w-xl p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                Semana 15.3
              </p>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
                Ofertas imperdiveis
              </h1>
              <p className="mt-3 text-lg text-white/85">
                Ate <strong>70% OFF</strong> em presentes, kits e experiencias.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/offers")}
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#760a0f] transition hover:bg-gray-100"
                >
                  Ver promocoes
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-white/80">
                Oferta relampago
              </p>
              <p className="mt-2 text-2xl font-bold">Por R$129,90</p>
              <p className="mt-1 text-sm text-white/85">Selecao de presentes com envio rapido.</p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-white/80">
                Com cupom
              </p>
              <p className="mt-2 text-2xl font-bold">Ate R$164,90 OFF</p>
              <p className="mt-1 text-sm text-white/85">Use cupons exclusivos da THEADORO.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {actionCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-xl bg-white p-4 text-gray-800 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-[18px] font-semibold text-gray-900">{card.title}</p>
              <card.icon className="my-3 h-9 w-9 text-[#760a0f]" />
              <p className="min-h-[52px] text-sm text-gray-600">{card.description}</p>
              <span className="mt-4 inline-flex rounded-md bg-[#f8eaeb] px-3 py-2 text-xs font-semibold text-[#760a0f]">
                {card.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeMarketplaceTop;
