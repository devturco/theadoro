import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { ProductFilters, Category } from '@/types/product';
import { Button } from '@theadoro/ui';
import { Checkbox } from '@theadoro/ui';
import { Slider } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Separator } from '@theadoro/ui';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: Partial<ProductFilters>) => void;
  onClearFilters: () => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  isOpen = true,
  onClose,
}) => {
  const { categories } = useCategories();

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    availability: true,
    type: true,
    tags: false,
  });

  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 1000
  ]);

  const popularTags = [
    'presente',
    'personalizado',
    'artesanal',
    'sustentável',
    'premium',
    'vintage',
    'moderno',
    'clássico',
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
    onFiltersChange({
      minPrice: values[0],
      maxPrice: values[1],
    });
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ category: categoryId });
    } else {
      onFiltersChange({ category: undefined });
    }
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      rating: filters.rating === rating ? undefined : rating,
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    onFiltersChange({ tags: newTags.length > 0 ? newTags : undefined });
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const sidebarClasses = cn(
    'bg-white border-r border-gray-200 h-full overflow-y-auto',
    'w-full flex-shrink-0',
    className
  );

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {getActiveFiltersCount() > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="mt-2 w-full"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Categories */}
        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Categorias</h3>
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.categories && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.category === category.id}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Preço</h3>
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.price && (
            <div className="mt-3 space-y-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Avaliação</h3>
            {expandedSections.rating ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.rating && (
            <div className="mt-3 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={cn(
                    'flex items-center space-x-2 w-full text-left p-2 rounded hover:bg-gray-50',
                    filters.rating === rating && 'bg-blue-50 border border-blue-200'
                  )}
                >
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        )}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-700">
                    {rating} estrela{rating > 1 ? 's' : ''} ou mais
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Availability */}
        <div>
          <button
            onClick={() => toggleSection('availability')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Disponibilidade</h3>
            {expandedSections.availability ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.availability && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in-stock"
                  checked={filters.inStock === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ inStock: checked ? true : undefined })
                  }
                />
                <label htmlFor="in-stock" className="text-sm text-gray-700 cursor-pointer">
                  Em estoque
                </label>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Type */}
        <div>
          <button
            onClick={() => toggleSection('type')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Tipo</h3>
            {expandedSections.type ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.type && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="products"
                  checked={filters.isService === false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ isService: checked ? false : undefined })
                  }
                />
                <label htmlFor="products" className="text-sm text-gray-700 cursor-pointer">
                  Produtos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="services"
                  checked={filters.isService === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ isService: checked ? true : undefined })
                  }
                />
                <label htmlFor="services" className="text-sm text-gray-700 cursor-pointer">
                  Serviços
                </label>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div>
          <button
            onClick={() => toggleSection('tags')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Tags</h3>
            {expandedSections.tags ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.tags && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      filters.tags?.includes(tag)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};