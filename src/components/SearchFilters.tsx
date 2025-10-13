import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface SearchFiltersProps {
  categories: FilterOption[];
  sellers: FilterOption[];
  priceRange: [number, number];
  maxPrice: number;
  selectedCategories: string[];
  selectedSellers: string[];
  selectedPriceRange: [number, number];
  onCategoryChange: (categoryId: string, checked: boolean) => void;
  onSellerChange: (sellerId: string, checked: boolean) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  className?: string;
}

export function SearchFilters({
  categories,
  sellers,
  priceRange,
  maxPrice,
  selectedCategories,
  selectedSellers,
  selectedPriceRange,
  onCategoryChange,
  onSellerChange,
  onPriceRangeChange,
  onClearFilters,
  className = ''
}: SearchFiltersProps) {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isSellersOpen, setIsSellersOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const activeFiltersCount = selectedCategories.length + selectedSellers.length + 
    (selectedPriceRange[0] !== priceRange[0] || selectedPriceRange[1] !== priceRange[1] ? 1 : 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Filtros Ativos</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((categoryId) => {
                const category = categories.find(c => c.id === categoryId);
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                    {category.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onCategoryChange(categoryId, false)}
                    />
                  </Badge>
                ) : null;
              })}
              {selectedSellers.map((sellerId) => {
                const seller = sellers.find(s => s.id === sellerId);
                return seller ? (
                  <Badge key={sellerId} variant="secondary" className="flex items-center gap-1">
                    {seller.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onSellerChange(sellerId, false)}
                    />
                  </Badge>
                ) : null;
              })}
              {(selectedPriceRange[0] !== priceRange[0] || selectedPriceRange[1] !== priceRange[1]) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  R$ {selectedPriceRange[0]} - R$ {selectedPriceRange[1]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onPriceRangeChange(priceRange)}
                  />
                </Badge>
              )}
            </div>
            <Separator className="mt-4" />
          </div>
        )}

        {/* Filtro por Categoria */}
        <Collapsible open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="text-sm font-medium">Categorias</h4>
            <Button variant="ghost" size="sm">
              {isCategoriesOpen ? '−' : '+'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => 
                    onCategoryChange(category.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                >
                  {category.label}
                  {category.count && (
                    <span className="text-gray-500 ml-1">({category.count})</span>
                  )}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Filtro por Faixa de Preço */}
        <Collapsible open={isPriceOpen} onOpenChange={setIsPriceOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="text-sm font-medium">Faixa de Preço</h4>
            <Button variant="ghost" size="sm">
              {isPriceOpen ? '−' : '+'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <div className="px-2">
              <Slider
                value={selectedPriceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                max={maxPrice}
                min={priceRange[0]}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>R$ {selectedPriceRange[0]}</span>
                <span>R$ {selectedPriceRange[1]}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Filtro por Vendedor */}
        <Collapsible open={isSellersOpen} onOpenChange={setIsSellersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h4 className="text-sm font-medium">Vendedores</h4>
            <Button variant="ghost" size="sm">
              {isSellersOpen ? '−' : '+'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {sellers.slice(0, 10).map((seller) => (
              <div key={seller.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`seller-${seller.id}`}
                  checked={selectedSellers.includes(seller.id)}
                  onCheckedChange={(checked) => 
                    onSellerChange(seller.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={`seller-${seller.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                >
                  {seller.label}
                  {seller.count && (
                    <span className="text-gray-500 ml-1">({seller.count})</span>
                  )}
                </label>
              </div>
            ))}
            {sellers.length > 10 && (
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver mais vendedores
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}