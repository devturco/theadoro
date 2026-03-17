import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white">
      {/* Top wave accent */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--wine-dark)), hsl(var(--wine)), hsl(var(--champagne-dark)), hsl(var(--wine)))' }} />

      <div className="container mx-auto px-4 py-10 sm:py-14">
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand — full width on mobile */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 space-y-4">
            <img
              src="/logo-colors.png"
              alt="THEADORO"
              className="h-12 w-auto"
            />
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              O marketplace premium de presentes, conectando você a vendedores excepcionais e experiências inesquecíveis.
            </p>
            <div className="flex gap-2">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Icon className="h-4 w-4 text-white" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Produtos', to: '/products' },
                { label: 'Categorias', to: '/categories' },
                { label: 'Vendedores', to: '/sellers' },
                { label: 'Ofertas', to: '/offers' },
                { label: 'Sobre nós', to: '/about' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
              Categorias
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Presentes', to: '/categories/presentes' },
                { label: 'Flores & Cestas', to: '/categories/flores' },
                { label: 'Moda', to: '/categories/moda' },
                { label: 'Beleza', to: '/categories/beleza' },
                { label: 'Decoração', to: '/categories/decoracao' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
              Contato
            </h4>
            <ul className="space-y-2.5 mb-6">
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Mail className="h-3.5 w-3.5 text-champagne shrink-0" />
                contato@theadoro.com.br
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Phone className="h-3.5 w-3.5 text-champagne shrink-0" />
                (65) 9999-9999
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin className="h-3.5 w-3.5 text-champagne shrink-0" />
                Cuiabá, MT
              </li>
            </ul>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-2">
                Receba novidades
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="flex-1 min-w-0 h-9 rounded-lg bg-white/10 border border-white/20 px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/50 transition-colors"
                />
                <button className="h-9 px-3 rounded-lg bg-wine text-white text-xs font-bold hover:bg-wine-dark transition-colors shrink-0">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p className="flex items-center gap-1">
              © {new Date().getFullYear()} THEADORO. Feito com <Heart className="h-3 w-3 text-champagne fill-current" /> em Cuiabá, MT.
            </p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-white/70 transition-colors">
                Privacidade
              </Link>
              <Link to="/terms" className="hover:text-white/70 transition-colors">
                Termos de Uso
              </Link>
              <Link to="/contact" className="hover:text-white/70 transition-colors">
                Contato
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
