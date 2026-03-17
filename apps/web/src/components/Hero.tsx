import { Button } from '@theadoro/ui';
import { Gift, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-gifts.jpg";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const { getSettingValue } = useSiteSettings('hero');
  const [emblaRef] = useEmblaCarousel({ loop: true, duration: 60 }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  const title = getSettingValue('title', 'Presentes, experiências e serviços — tudo em um só lugar');
  const subtitle = getSettingValue('subtitle', 'Descubra produtos únicos e serviços especiais de vendedores que encantam. Encontre o presente perfeito ou agende uma experiência inesquecível.');
  const bgImage = getSettingValue('bg_image', heroImage);
  const heroImages = getSettingValue('hero_images', []);
  const highlightText = getSettingValue('highlight_text', 'tudo em um só lugar');
  const statProducts = getSettingValue('stat_products', '1000+');
  const statSellers = getSettingValue('stat_sellers', '500+');
  const statSatisfaction = getSettingValue('stat_satisfaction', '98%');

  // Helper to split title and highlight
  const renderTitle = () => {
    if (!highlightText || !title.includes(highlightText)) {
      return title;
    }
    const parts = title.split(highlightText);
    return (
      <>
        {parts[0]}
        <span className="text-champagne">{highlightText}</span>
        {parts[1]}
      </>
    );
  };

  const imagesToDisplay = Array.isArray(heroImages) && heroImages.length > 0 ? heroImages : [bgImage];

  return (
    <section className="relative h-[600px] overflow-hidden group">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {imagesToDisplay.map((img: string, idx: number) => (
            <div className="flex-[0_0_100%] min-w-0 relative h-full" key={idx}>
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(${img})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-graphite/90 via-graphite/70 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container relative h-full mx-auto px-4 flex items-center z-10 pointer-events-none">
        <div className="max-w-2xl space-y-6 animate-fade-in pointer-events-auto">
          <h2 className="text-6xl font-serif font-bold text-white leading-tight">
            {renderTitle()}
          </h2>
          <p className="text-xl text-white/90 font-light">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button variant="wine" size="lg" className="text-lg px-8" onClick={() => navigate('/products')}>
              <Gift className="mr-2 h-5 w-5" />
              Explorar Presentes
            </Button>
            <Button variant="champagne" size="lg" className="text-lg px-8" onClick={() => navigate('/categories/experiencias')}>
              <Calendar className="mr-2 h-5 w-5" />
              Agendar Serviço
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-8">
            <div className="text-white">
              <div className="text-3xl font-bold text-champagne">{statProducts}</div>
              <div className="text-sm text-white/80">Produtos Premium</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold text-champagne">{statSellers}</div>
              <div className="text-sm text-white/80">Vendedores Verificados</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold text-champagne">{statSatisfaction}</div>
              <div className="text-sm text-white/80">Clientes Satisfeitos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
