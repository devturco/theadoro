import { useState } from 'react';
import { Grid, List, SortAsc } from 'lucide-react';
import { Button } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/product';

interface SearchResultsProps {
  products: Product[];
  query: string;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSortChange: (sort: string) => void;
  isLoading?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export function SearchResults({
  products,
  query,
  totalResults,
  currentPage,
  totalPages,
  onPageChange,
  onSortChange,
  isLoading = false,
  className = ''
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    onSortChange(value);
  };

  const sortOptions = [
    { value: 'relevance', label: 'Mais Relevantes' },
    { value: 'price-asc', label: 'Menor Preço' },
    { value: 'price-desc', label: 'Maior Preço' },
    { value: 'rating', label: 'Melhor Avaliação' },
    { value: 'newest', label: 'Mais Recentes' }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Products Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com resultados e controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {totalResults > 0 ? (
              <>
                {totalResults.toLocaleString()} resultado{totalResults !== 1 ? 's' : ''} 
                {query && (
                  <span className="text-gray-600"> para "{query}"</span>
                )}
              </>
            ) : (
              <>
                Nenhum resultado encontrado
                {query && (
                  <span className="text-gray-600"> para "{query}"</span>
                )}
              </>
            )}
          </h2>
          {totalResults > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Página {currentPage} de {totalPages}
            </p>
          )}
        </div>

        {totalResults > 0 && (
          <div className="flex items-center gap-3">
            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modo de visualização */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {totalResults > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        por {product.seller?.full_name || product.seller?.name || 'Vendedor'}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(product.rating || 0)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({product.review_count || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-pink-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-gray-500 line-through">
                            R$ {product.original_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                  const page = index + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Estado vazio */
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Tente ajustar seus filtros ou buscar por outros termos
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/products'}>
            Ver Todos os Produtos
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchResults;