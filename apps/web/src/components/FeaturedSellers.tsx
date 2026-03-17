import { Button } from '@theadoro/ui';
import { Link } from "react-router-dom";
import { Star, MapPin, Award } from "lucide-react";
import { useSellers } from "@/hooks/useSellers";
import { Skeleton } from '@theadoro/ui';

const FeaturedSellers = () => {
  const { sellers, loading } = useSellers({
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const featuredSellers = sellers.slice(0, 3);
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-4">
            Compre de Quem Encanta
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça vendedores verificados que oferecem produtos e serviços excepcionais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))
          ) : (
            featuredSellers.map((seller, index) => (
              <div
                key={seller.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-wine transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header Image */}
                <div className="relative h-32 bg-gradient-wine">
                  {seller.avatar && (
                    <img
                      src={seller.avatar}
                      alt={seller.name}
                      className="w-full h-full object-cover opacity-20"
                    />
                  )}
                </div>

                {/* Avatar */}
                <div className="relative px-6 pb-6">
                  <div className="absolute -top-16 left-6">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full bg-card border-4 border-card shadow-lg overflow-hidden">
                        <img
                          src={seller.avatar || "/placeholder.svg"}
                          alt={seller.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {seller.verified && (
                        <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2">
                          <Award className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-16 space-y-4">
                    {/* Name & Category */}
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {seller.name}
                      </h3>
                      <p className="text-sm text-muted-foreground italic">
                        {seller.mainCategory || "Vendedor Especialista"}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-champagne text-champagne" />
                        <span className="font-medium">{seller.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({seller.reviewCount})</span>
                      </div>
                      <div className="text-muted-foreground">
                        {seller.productCount} produtos
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {seller.location}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="wine" className="flex-1" asChild>
                        <Link to={`/sellers/${seller.id}`}>
                          Visitar Loja
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/sellers/${seller.id}#products`}>
                          Ver Produtos
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Conhecer Mais Vendedores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSellers;
