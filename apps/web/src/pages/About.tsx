import React from 'react';
import { Heart, Users, Award, Mail, Phone, ShoppingBag, Star, Clock } from 'lucide-react';
import { Button } from '@theadoro/ui';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop"
          alt="Presentes THEADORO"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="container mx-auto px-4 relative z-20 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-fade-in translate-y-4">
            A Arte de Presentear
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed opacity-90 animate-fade-in delay-100">
            Mais do que produtos, entregamos sentimentos. Conectando histórias através de gestos inesquecíveis.
          </p>
        </div>
      </section>

      {/* Our Essence */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="space-y-8 animate-fade-in">
              <span className="text-wine font-bold tracking-widest uppercase text-sm">Nossa Essência</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
                Transformando mimos em memórias eternas.
              </h2>
              <div className="space-y-6 text-lg text-gray-600 font-light leading-relaxed">
                <p>
                  A THEADORO nasceu da crença de que todo presente carrega uma parte de quem presenteia.
                  Começamos como um sonho pequeno e nos tornamos o destino favorito de quem busca
                  sofisticação e significado.
                </p>
                <p>
                  Nossa curadoria é feita a "quatro mãos" com produtores locais e grandes marcas,
                  garantindo que cada item em nossa plataforma tenha qualidade, alma e propósito.
                </p>
              </div>
            </div>
            <div className="relative animate-fade-in delay-200">
              <div className="absolute -inset-4 bg-gray-50 rounded-full blur-3xl opacity-50 z-0" />
              <img
                src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1974&auto=format&fit=crop"
                alt="Curadoria de Presentes"
                className="relative z-10 rounded-2xl shadow-2xl w-full object-cover aspect-4/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Heart,
                title: "Curadoria Afetiva",
                text: "Selecionamos cada produto pensando na emoção de quem vai receber."
              },
              {
                icon: Star,
                title: "Qualidade Premium",
                text: "Parceria apenas com os melhores fornecedores e artesãos do mercado."
              },
              {
                icon: Users,
                title: "Conexão Real",
                text: "Uma comunidade de vendedores apaixonados pelo que fazem."
              }
            ].map((value, idx) => (
              <div key={idx} className="bg-white p-10 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                <div className="w-14 h-14 bg-wine/5 text-wine rounded-full flex items-center justify-center mb-6 group-hover:bg-wine group-hover:text-white transition-colors">
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Minimalist */}
      <section className="py-20 bg-wine text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto text-center divide-white/20 md:divide-x-0">
            {[
              { label: "Clientes Felizes", value: "25k+" },
              { label: "Vendedores", value: "1.2k" },
              { label: "Produtos", value: "5k+" },
              { label: "Avaliação", value: "4.9" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl md:text-5xl font-serif font-bold mb-2">{stat.value}</div>
                <div className="text-sm uppercase tracking-widest opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
            Faça parte da nossa história
          </h2>
          <p className="text-xl text-gray-600 font-light mb-10 max-w-2xl mx-auto">
            Seja para comprar o presente perfeito ou para vender suas criações para todo o Brasil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-wine hover:bg-wine-dark text-white px-8 h-12 text-base" asChild>
              <Link to="/products">Explorar Loja</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-50 text-gray-900 px-8 h-12 text-base" asChild>
              <Link to="/seller/onboarding">Quero Vender</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Simple Footer Location/Contact */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-center gap-12 text-gray-600 font-light text-sm">
            <div className="flex flex-col items-center gap-3">
              <Mail className="w-5 h-5 text-wine" />
              <span>contato@theadoro.com.br</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Clock className="w-5 h-5 text-wine" />
              <span>Seg - Sex: 9h às 18h</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 text-wine font-bold text-lg leading-none">@</div>
              <span>São Paulo, SP</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;