import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductFilters } from '@/types/product';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/ProductGrid';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Button } from '@theadoro/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Separator } from '@theadoro/ui';
import { Sheet, SheetContent, SheetTrigger } from '@theadoro/ui';
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

  // A página controla os filtros (inclusive a URL); o hook só executa a busca.
  const {
    products,
    loading,
    error,
    totalCount,
    totalPages,
    fetchProducts,
  } = useProducts({ autoFetch: false });

  useEffect(() => {
    fetchProducts({ ...filters, sortBy, page: currentPage, limit: 24 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, currentPage]);

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
        <div className="flex flex-col lg:flex-row gap-6">
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
            {/* Toolbar — Mobile-First Redesign */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2 sm:p-4 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                {/* Filters & Sort (Compact on Mobile) */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="flex-1 lg:hidden h-10 py-0 px-3 rounded-xl border-gray-200">
                        <Filter className="h-4 w-4 mr-2 text-wine" />
                        <span className="text-xs font-bold uppercase tracking-tight">Filtros</span>
                        {getActiveFiltersCount() > 0 && (
                          <Badge className="ml-1.5 bg-wine text-white h-5 px-1.5 min-w-[18px] justify-center border-none text-[10px]">
                            {getActiveFiltersCount()}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] p-0 rounded-r-3xl overflow-hidden">
                      <FilterSidebar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClearFilters={handleClearFilters}
                        onClose={() => setShowMobileFilters(false)}
                      />
                    </SheetContent>
                  </Sheet>

                  <div className="lg:hidden flex-1">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-full h-10 rounded-xl border-gray-200 text-xs font-bold uppercase tracking-tight">
                        <div className="flex items-center text-gray-700">
                          <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-gray-400" />
                          <SelectValue placeholder="Ordenar" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl">
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Counter & View Mode (Desktop mostly) */}
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
                  <span className="text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest px-1 sm:px-0">
                    {formatResultsText()}
                  </span>

                  <div className="flex items-center gap-4">
                    {/* Desktop Sort */}
                    <div className="hidden lg:flex items-center gap-2">
                      <span className="text-sm text-gray-500 whitespace-nowrap">Ordenar por:</span>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-44 h-10 rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="hidden sm:flex items-center border border-gray-200 rounded-xl overflow-hidden h-10">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn("rounded-none px-3 border-none", viewMode === 'grid' ? "bg-wine text-white" : "text-gray-500")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={cn("rounded-none px-3 border-none", viewMode === 'list' ? "bg-wine text-white" : "text-gray-500")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filters Row */}
              {getActiveFiltersCount() > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Filtros:</span>
                  {filters.category && (
                    <Badge variant="outline" className="gap-1 border-gray-200 text-gray-600 font-medium py-1">
                      Categoria
                      <X className="h-3.5 w-3.5 cursor-pointer hover:text-wine" onClick={() => handleFiltersChange({ category: undefined })} />
                    </Badge>
                  )}
                  {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                    <Badge variant="outline" className="gap-1 border-gray-200 text-gray-600 font-medium py-1">
                      Preço
                      <X className="h-3.5 w-3.5 cursor-pointer hover:text-wine" onClick={() => handleFiltersChange({ minPrice: undefined, maxPrice: undefined })} />
                    </Badge>
                  )}
                  {filters.rating && (
                    <Badge variant="outline" className="gap-1 border-gray-200 text-gray-600 font-medium py-1">
                      {filters.rating}+ estrelas
                      <X className="h-3.5 w-3.5 cursor-pointer hover:text-wine" onClick={() => handleFiltersChange({ rating: undefined })} />
                    </Badge>
                  )}
                  {filters.tags && filters.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1 border-gray-200 text-gray-600 font-medium py-1">
                      {tag}
                      <X
                        className="h-3.5 w-3.5 cursor-pointer hover:text-wine"
                        onClick={() => {
                          const newTags = filters.tags!.filter(t => t !== tag);
                          handleFiltersChange({ tags: newTags.length > 0 ? newTags : undefined });
                        }}
                      />
                    </Badge>
                  ))}
                  <Button variant="link" size="sm" onClick={handleClearFilters} className="text-wine text-[10px] h-auto p-0 font-bold uppercase ml-auto">
                    Limpar Tudo
                  </Button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="min-h-[400px]">
              <ProductGrid
                products={products}
                loading={loading}
                emptyMessage={
                  getActiveFiltersCount() > 0
                    ? 'Nenhum produto encontrado com os filtros selecionados.'
                    : 'Nenhum produto encontrado.'
                }
              />
            </div>

            {/* Simple Mobile-Friendly Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (currentPage > 1) handlePageChange(currentPage - 1); }}
                  disabled={currentPage === 1}
                  className="rounded-xl border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  <span className="text-xs font-bold text-gray-900">{currentPage}</span>
                  <span className="text-xs text-gray-400">/</span>
                  <span className="text-xs text-gray-400">{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-gray-200"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;