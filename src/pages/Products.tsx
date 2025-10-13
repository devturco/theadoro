import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, Filter, SlidersHorizontal } from 'lucide-react';
import { ProductFilters } from '@/types/product';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/ProductGrid';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'A-Z' },
  { value: 'name_desc', label: 'Z-A' },
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'newest', label: 'Mais recentes' },
];

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      category: params.category || undefined,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      rating: params.rating ? Number(params.rating) : undefined,
      inStock: params.inStock === 'true' ? true : undefined,
      isService: params.isService === 'true' ? true : params.isService === 'false' ? false : undefined,
      tags: params.tags ? params.tags.split(',') : undefined,
      search: params.search || undefined,
    };
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  const {
    products,
    loading,
    error,
    totalCount,
    totalPages,
    refetch,
  } = useProducts({
    filters,
    sortBy,
    page: currentPage,
    limit: 24,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.rating) params.set('rating', filters.rating.toString());
    if (filters.inStock !== undefined) params.set('inStock', filters.inStock.toString());
    if (filters.isService !== undefined) params.set('isService', filters.isService.toString());
    if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    if (filters.search) params.set('search', filters.search);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());

    setSearchParams(params);
  }, [filters, sortBy, currentPage, setSearchParams]);

  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.rating) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.isService !== undefined) count++;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    return count;
  };

  const formatResultsText = () => {
    if (loading) return 'Carregando...';
    if (error) return 'Erro ao carregar produtos';
    
    const start = (currentPage - 1) * 24 + 1;
    const end = Math.min(currentPage * 24, totalCount);
    
    return `Mostrando ${start}-${end} de ${totalCount} produtos`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.search ? `Resultados para "${filters.search}"` : 'Todos os Produtos'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Descubra presentes únicos e especiais
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile Filter Button */}
                  <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {getActiveFiltersCount() > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {getActiveFiltersCount()}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0">
                      <FilterSidebar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClearFilters={handleClearFilters}
                        onClose={() => setShowMobileFilters(false)}
                      />
                    </SheetContent>
                  </Sheet>

                  {/* Results Count */}
                  <span className="text-sm text-gray-600">
                    {formatResultsText()}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:block">
                      Ordenar por:
                    </span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* View Mode */}
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none rounded-l-md"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none rounded-r-md"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">Filtros ativos:</span>
                    
                    {filters.category && (
                      <Badge variant="secondary" className="gap-1">
                        Categoria
                        <button
                          onClick={() => handleFiltersChange({ category: undefined })}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    
                    {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                      <Badge variant="secondary" className="gap-1">
                        Preço
                        <button
                          onClick={() => handleFiltersChange({ minPrice: undefined, maxPrice: undefined })}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    
                    {filters.rating && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.rating}+ estrelas
                        <button
                          onClick={() => handleFiltersChange({ rating: undefined })}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    
                    {filters.tags && filters.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = filters.tags!.filter(t => t !== tag);
                            handleFiltersChange({ tags: newTags.length > 0 ? newTags : undefined });
                          }}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Limpar todos
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              error={error}
              viewMode={viewMode}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              emptyMessage={
                getActiveFiltersCount() > 0
                  ? 'Nenhum produto encontrado com os filtros selecionados.'
                  : 'Nenhum produto encontrado.'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;