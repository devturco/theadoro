import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-graphite text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <img 
              src="/logo-colors.png" 
              alt="THEADORO" 
              className="h-16 w-auto"
            />
            <p className="text-white/80 text-sm leading-relaxed">
              O marketplace premium que conecta você a vendedores excepcionais,
              presentes únicos e experiências inesquecíveis.
            </p>
            <div className="flex gap-3">
              <Button size="icon" variant="ghost" className="hover:bg-white/10">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-white/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-white/10">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-champagne mb-4">Links Rápidos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/sobre" className="text-white/80 hover:text-champagne transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="text-white/80 hover:text-champagne transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link to="/vendedores" className="text-white/80 hover:text-champagne transition-colors">
                  Seja um Vendedor
                </Link>
              </li>
              <li>
                <Link to="/ajuda" className="text-white/80 hover:text-champagne transition-colors">
                  Central de Ajuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-champagne mb-4">Categorias</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/presentes" className="text-white/80 hover:text-champagne transition-colors">
                  Presentes
                </Link>
              </li>
              <li>
                <Link to="/flores" className="text-white/80 hover:text-champagne transition-colors">
                  Flores & Cestas
                </Link>
              </li>
              <li>
                <Link to="/moda" className="text-white/80 hover:text-champagne transition-colors">
                  Moda
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="text-white/80 hover:text-champagne transition-colors">
                  Serviços
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-champagne mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <Mail className="h-4 w-4 text-champagne" />
                contato@theadoro.com.br
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Phone className="h-4 w-4 text-champagne" />
                (11) 9999-9999
              </li>
              <li className="flex items-start gap-2 text-white/80">
                <MapPin className="h-4 w-4 text-champagne mt-0.5" />
                São Paulo, SP
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm text-white/80 mb-3">Receba novidades e ofertas</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button variant="wine" size="sm">
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>© 2024 THEADORO. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link to="/privacidade" className="hover:text-champagne transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="hover:text-champagne transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
