import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Star } from "lucide-react";

// Mock data - would come from API in real app
const products = [
  {
    id: 1,
    name: "Bouquet Premium de Rosas",
    price: 249.90,
    originalPrice: 299.90,
    image: "/placeholder.svg",
    seller: "Flores da Vila",
    rating: 4.9,
    reviews: 127,
    badge: "Mais Vendido",
  },
  {
    id: 2,
    name: "Kit Spa Premium para Presente",
    price: 189.90,
    image: "/placeholder.svg",
    seller: "Essence & Beauty",
    rating: 5.0,
    reviews: 89,
    badge: "Destaque",
  },
  {
    id: 3,
    name: "Bolsa de Couro Artesanal",
    price: 549.90,
    image: "/placeholder.svg",
    seller: "Atelier Elegance",
    rating: 4.8,
    reviews: 64,
    badge: "Novo",
  },
  {
    id: 4,
    name: "Jantar Romântico a Dois",
    price: 399.90,
    image: "/placeholder.svg",
    seller: "Momentos Especiais",
    rating: 4.9,
    reviews: 156,
    badge: "Experiência",
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div className="animate-fade-in">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Selecionados especialmente para você
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex">
            Ver Todos os Produtos
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-wine transition-all duration-300 animate-fade-in hover-scale"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.badge && (
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                    {product.badge}
                  </Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {/* Seller */}
                <p className="text-xs text-muted-foreground">{product.seller}</p>

                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-champagne text-champagne" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <Button variant="wine" className="w-full group-hover:shadow-wine">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 md:hidden">
          <Button variant="outline" className="w-full sm:w-auto">
            Ver Todos os Produtos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
