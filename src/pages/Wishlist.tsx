import React from 'react';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistItemProps {
  product: any;
  onRemove: (productId: string) => void;
  onAddToCart: (product: any) => void;
}

const WishlistItem: React.FC<WishlistItemProps> = ({ product, onRemove, onAddToCart }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link 
              to={`/products/${product.id}`}
              className="block hover:text-primary transition-colors"
            >
              <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
            </Link>
            
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  R$ {product.price?.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddToCart(product)}
                  className="flex items-center gap-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemove(product.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyWishlist: React.FC = () => {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Heart className="w-12 h-12 text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">Sua lista de favoritos está vazia</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Explore nossos produtos e adicione seus favoritos para encontrá-los facilmente depois.
      </p>
      
      <div className="flex gap-4 justify-center">
        <Button asChild>
          <Link to="/products">
            Explorar Produtos
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link to="/categories">
            Ver Categorias
          </Link>
        </Button>
      </div>
    </div>
  );
};

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">Faça login para ver seus favoritos</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Entre na sua conta para acessar sua lista de produtos favoritos.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/auth">
                  Fazer Login
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/products">
                  Explorar Produtos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500" />
              Meus Favoritos
            </h1>
            {wishlist.length > 0 && (
              <p className="text-gray-600 mt-1">
                {wishlist.length} {wishlist.length === 1 ? 'produto' : 'produtos'} na sua lista
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {wishlist.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="space-y-4">
            {wishlist.map((product) => (
              <WishlistItem
                key={product.id}
                product={product}
                onRemove={handleRemoveFromWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        {wishlist.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/products">
                Continuar Comprando
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;