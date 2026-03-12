import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SearchResults } from '@/components/SearchResults';
import { SearchFilters } from '@/components/SearchFilters';
import { useProducts } from '@/hooks/useProducts';
import { useCRUD } from '@/hooks/useCRUD'; // For categories

const trendingSearches = [
  'buquê de rosas',
  'presente dia das mães',
  'cesta café da manhã',
  'kit spa',
  'perfume feminino',
  'bolsa couro'
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // Use the hook
  const {
    products,
    loading,
    filters,
    updateFilters,
    pagination,
    goToPage
  } = useProducts({
    initialFilters: { search: initialQuery, limit: 12 },
    autoFetch: true
  });

  const { data: categories } = useCRUD({ table: 'categories' });

  // Mock sellers for filter sidebar (since we don't have a hook for sellers yet)
  const sellers = [
    { id: '1', label: 'Todos os Vendedores', count: 0 }
  ];

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Update query state when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
    if (urlQuery && urlQuery !== filters.search) {
      updateFilters({ search: urlQuery });
      setHasSearched(true);
    }
  }, [searchParams]);

  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    updateFilters({ search: searchQuery, page: 1 });

    // Add to history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    // Update URL
    setSearchParams({ q: searchQuery });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    // SearchFilters might need adjustment to handle single category or array
    // Assuming useProducts supports single category for now based on hook
    updateFilters({ category: checked ? categoryId : undefined });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    updateFilters({ minPrice: range[0], maxPrice: range[1] });
  };

  const handleSortChange = (sort: string) => {
    updateFilters({ sortBy: sort });
  };

  const handleClearFilters = () => {
    updateFilters({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      rating: undefined,
      seller: undefined
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Conteúdo Principal */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <div className="lg:w-64 flex-shrink-0">
            <SearchFilters
              categories={categories?.map((c: any) => ({ id: c.id, label: c.name, count: 0 })) || []}
              sellers={[]}
              priceRange={[0, 10000]}
              maxPrice={10000}
              selectedCategories={filters.category ? [filters.category] : []}
              selectedSellers={[]}
              selectedPriceRange={[filters.minPrice || 0, filters.maxPrice || 10000]}
              onCategoryChange={handleCategoryChange}
              onSellerChange={() => { }}
              onPriceRangeChange={handlePriceRangeChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Resultados */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {query ? `Resultados para "${query}"` : 'Todos os Produtos'}
              </h1>
              <p className="text-gray-500 mt-2">
                {pagination.total} produtos encontrados
              </p>
            </div>

            <SearchResults
              products={products}
              query={filters.search || ''}
              totalResults={pagination.total}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
              onSortChange={handleSortChange}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}