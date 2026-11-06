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
    <section className="py-10 sm:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-foreground">
              Compre de Quem Encanta
            </h2>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              Vendedores verificados com produtos excepcionais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-card shadow-[0_1px_2px_hsl(346_25%_12%/0.05)] transition-all duration-300 hover:shadow-[0_2px_4px_hsl(346_25%_12%/0.06),0_16px_32px_-16px_hsl(346_25%_12%/0.22)] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header Image */}
                <div className="relative h-32 bg-wine">
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
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-wine shadow-lg">
                        {seller.avatar ? (
                          <img
                            src={seller.avatar}
                            alt={seller.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-serif text-3xl font-bold text-white">
                            {seller.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        )}
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
                        <Star className="h-4 w-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
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

        <div className="text-center mt-8">
          <a href="/sellers" className="inline-flex items-center gap-2 px-6 py-2.5 border border-border rounded-full text-sm font-medium text-gray-700 hover:border-wine hover:text-wine transition-colors">
            Conhecer Mais Vendedores
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSellers;
