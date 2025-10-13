import React, { useState } from 'react';
import { Search, Filter, MapPin, Star, CheckCircle, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SellerCard } from '@/components/SellerCard';
import { useSellers, SellerFilters } from '@/hooks/useSellers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Filter Sidebar Component
const FilterSidebar: React.FC<{
  filters: SellerFilters;
  onFiltersChange: (filters: SellerFilters) => void;
  className?: string;
}> = ({ filters, onFiltersChange, className }) => {
  const locations = [
    'São Paulo, SP',
    'Rio de Janeiro, RJ',
    'Belo Horizonte, MG',
    'Brasília, DF',
    'Salvador, BA',
    'Fortaleza, CE',
    'Recife, PE',
    'Porto Alegre, RS',
    'Curitiba, PR',
    'Goiânia, GO'
  ];

  const specialties = [
    'Artesanato',
    'Confeitaria',
    'Floricultura',
    'Decoração',
    'Presentes Personalizados',
    'Bolos Personalizados',
    'Doces Gourmet',
    'Arranjos',
    'Plantas Ornamentais',
    'Joias',
    'Roupas',
    'Acessórios'
  ];

  const updateFilter = (key: keyof SellerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value
    });
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Location Filter */}
        <div>
          <h3 className="font-semibold mb-3">Localização</h3>
          <Select
            value={filters.location || 'all'}
            onValueChange={(value) => updateFilter('location', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as cidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Specialty Filter */}
        <div>
          <h3 className="font-semibold mb-3">Especialidade</h3>
          <Select
            value={filters.specialty || 'all'}
            onValueChange={(value) => updateFilter('specialty', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as especialidades</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Verified Filter */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.verified || false}
              onCheckedChange={(checked) => updateFilter('verified', checked || undefined)}
            />
            <Label htmlFor="verified" className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              Apenas verificados
            </Label>
          </div>
        </div>

        <Separator />

        {/* Rating Filter */}
        <div>
          <h3 className="font-semibold mb-3">Avaliação mínima</h3>
          <Select
            value={filters.minRating?.toString() || 'all'}
            onValueChange={(value) => updateFilter('minRating', value === 'all' ? undefined : parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualquer avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer avaliação</SelectItem>
              <SelectItem value="4.5">4.5+ estrelas</SelectItem>
              <SelectItem value="4.0">4.0+ estrelas</SelectItem>
              <SelectItem value="3.5">3.5+ estrelas</SelectItem>
              <SelectItem value="3.0">3.0+ estrelas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={() => onFiltersChange({})}
          className="w-full"
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};

// Empty State Component
const EmptySellers: React.FC = () => (
  <div className="text-center py-12">
    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <Search className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Nenhum vendedor encontrado
    </h3>
    <p className="text-gray-600 mb-4">
      Tente ajustar os filtros ou buscar por outros termos.
    </p>
  </div>
);

// Main Sellers Page Component
export const Sellers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { sellers, loading, error, totalCount, hasMore, loadMore, filters, setFilters } = useSellers();

  // Filter sellers based on search term
  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.specialties.some(specialty =>
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [SellerFilters['sortBy'], SellerFilters['sortOrder']];
    setFilters({
      ...filters,
      sortBy,
      sortOrder
    });
  };

  const currentSort = filters.sortBy && filters.sortOrder 
    ? `${filters.sortBy}-${filters.sortOrder}` 
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
              <p className="text-gray-600 mt-1">
                Descubra artesãos e vendedores únicos para seus presentes especiais
              </p>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar vendedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating-desc">Melhor avaliados</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="joinedAt-desc">Mais recentes</SelectItem>
                  <SelectItem value="joinedAt-asc">Mais antigos</SelectItem>
                  <SelectItem value="productCount-desc">Mais produtos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Filter className="w-5 h-5 mr-2" />
                  <h2 className="font-semibold">Filtros</h2>
                </div>
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Refine sua busca por vendedores
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {loading ? 'Carregando...' : `${filteredSellers.length} de ${totalCount} vendedores`}
                </span>
                
                {/* Active Filters */}
                <div className="flex flex-wrap gap-2 ml-4">
                  {filters.location && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {filters.location}
                    </Badge>
                  )}
                  {filters.specialty && (
                    <Badge variant="secondary">
                      {filters.specialty}
                    </Badge>
                  )}
                  {filters.verified && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verificados
                    </Badge>
                  )}
                  {filters.minRating && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {filters.minRating}+ estrelas
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && sellers.length === 0 && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredSellers.length === 0 && !error && (
              <EmptySellers />
            )}

            {/* Sellers Grid */}
            {filteredSellers.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredSellers.map((seller) => (
                    <SellerCard
                      key={seller.id}
                      seller={seller}
                      variant="default"
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Carregando...
                        </>
                      ) : (
                        'Carregar mais vendedores'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sellers;