import { Button } from "@/components/ui/button";
import { Gift, Calendar, Heart } from "lucide-react";
import heroImage from "@/assets/hero-gifts.jpg";

const Hero = () => {
  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-graphite/90 via-graphite/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative h-full mx-auto px-4 flex items-center">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h2 className="text-6xl font-serif font-bold text-white leading-tight">
            Presentes, experiências e serviços —{" "}
            <span className="text-champagne">tudo em um só lugar</span>
          </h2>
          <p className="text-xl text-white/90 font-light">
            Descubra produtos únicos e serviços especiais de vendedores que encantam.
            Encontre o presente perfeito ou agende uma experiência inesquecível.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Button variant="wine" size="lg" className="text-lg px-8">
              <Gift className="mr-2 h-5 w-5" />
              Explorar Presentes
            </Button>
            <Button variant="champagne" size="lg" className="text-lg px-8">
              <Calendar className="mr-2 h-5 w-5" />
              Agendar Serviço
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-8">
            <div className="text-white">
              <div className="text-3xl font-bold text-champagne">1000+</div>
              <div className="text-sm text-white/80">Produtos Premium</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold text-champagne">500+</div>
              <div className="text-sm text-white/80">Vendedores Verificados</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold text-champagne">98%</div>
              <div className="text-sm text-white/80">Clientes Satisfeitos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
