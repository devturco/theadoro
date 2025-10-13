import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Clock, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SearchResults } from '@/components/SearchResults';
import { SearchFilters } from '@/components/SearchFilters';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  isWishlisted?: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Buquê de Rosas Vermelhas Premium',
    price: 89.90,
    originalPrice: 120.00,
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20red%20roses%20bouquet%20elegant%20arrangement%20romantic&image_size=square_hd',
    rating: 4.8,
    reviewCount: 124,
    sellerId: '1',
    sellerName: 'Floricultura Bella',
    categoryId: '1',
    isWishlisted: false
  },
  {
    id: '2',
    name: 'Cesta de Café da Manhã Gourmet',
    price: 156.90,
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=gourmet%20breakfast%20basket%20coffee%20pastries%20elegant%20presentation&image_size=square_hd',
    rating: 4.9,
    reviewCount: 89,
    sellerId: '2',
    sellerName: 'Delícias & Cia',
    categoryId: '1',
    isWishlisted: true
  },
  {
    id: '3',
    name: 'Kit Presente Spa Relaxante',
    price: 234.90,
    originalPrice: 299.90,
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=spa%20gift%20set%20relaxing%20products%20wellness%20luxury&image_size=square_hd',
    rating: 4.7,
    reviewCount: 67,
    sellerId: '3',
    sellerName: 'Bem-Estar Natural',
    categoryId: '1',
    isWishlisted: false
  },
  {
    id: '4',
    name: 'Arranjo de Flores Mistas',
    price: 67.90,
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=mixed%20flowers%20arrangement%20colorful%20beautiful%20bouquet&image_size=square_hd',
    rating: 4.6,
    reviewCount: 45,
    sellerId: '1',
    sellerName: 'Floricultura Bella',
    categoryId: '2',
    isWishlisted: false
  },
  {
    id: '5',
    name: 'Perfume Feminino Floral',
    price: 189.90,
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20perfume%20bottle%20floral%20fragrance%20luxury%20cosmetics&image_size=square_hd',
    rating: 4.5,
    reviewCount: 78,
    sellerId: '4',
    sellerName: 'Perfumaria Elegante',
    categoryId: '3',
    isWishlisted: false
  },
  {
    id: '6',
    name: 'Bolsa de Couro Premium',
    price: 299.90,
    originalPrice: 399.90,
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20leather%20handbag%20elegant%20fashion%20accessory&image_size=square_hd',
    rating: 4.8,
    reviewCount: 92,
    sellerId: '5',
    sellerName: 'Moda & Estilo',
    categoryId: '4',
    isWishlisted: true
  }
];

const mockCategories: FilterOption[] = [
  { id: '1', label: 'Presentes', count: 245 },
  { id: '2', label: 'Flores & Cestas', count: 156 },
  { id: '3', label: 'Beleza & Bem-estar', count: 134 },
  { id: '4', label: 'Moda', count: 189 },
  { id: '5', label: 'Serviços', count: 78 },
  { id: '6', label: 'Experiências', count: 92 }
];

const mockSellers: FilterOption[] = [
  { id: '1', label: 'Floricultura Bella', count: 45 },
  { id: '2', label: 'Delícias & Cia', count: 32 },
  { id: '3', label: 'Bem-Estar Natural', count: 28 },
  { id: '4', label: 'Perfumaria Elegante', count: 23 },
  { id: '5', label: 'Moda & Estilo', count: 19 }
];

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
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Filtros
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [priceRange] = useState<[number, number]>([0, 500]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 500]);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedCategories, selectedSellers, selectedPriceRange]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filtrar produtos baseado na query
    const results = mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setProducts(results);
    setCurrentPage(1);
    setIsLoading(false);
    
    // Adicionar ao histórico
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    // Atualizar URL
    setSearchParams({ q: searchQuery });
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Filtro por categoria
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => 
        selectedCategories.includes(product.categoryId)
      );
    }
    
    // Filtro por vendedor
    if (selectedSellers.length > 0) {
      filtered = filtered.filter(product => 
        selectedSellers.includes(product.sellerId)
      );
    }
    
    // Filtro por preço
    filtered = filtered.filter(product => 
      product.price >= selectedPriceRange[0] && product.price <= selectedPriceRange[1]
    );
    
    setFilteredProducts(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  const handleSellerChange = (sellerId: string, checked: boolean) => {
    if (checked) {
      setSelectedSellers([...selectedSellers, sellerId]);
    } else {
      setSelectedSellers(selectedSellers.filter(id => id !== sellerId));
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSellers([]);
    setSelectedPriceRange(priceRange);
  };

  const handleSortChange = (sort: string) => {
    let sorted = [...filteredProducts];
    
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Manter ordem original para "mais recentes"
        break;
      default:
        // Relevância - manter ordem original
        break;
    }
    
    setFilteredProducts(sorted);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header de Busca */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
            Buscar Produtos
          </h1>
          
          {/* Formulário de Busca */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="O que você está procurando?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 pr-4 py-3 text-lg"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                size="sm"
              >
                Buscar
              </Button>
            </div>
            
            {/* Sugestões e Histórico */}
            {showSuggestions && (query || searchHistory.length > 0) && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-10">
                <CardContent className="p-4">
                  {/* Histórico de Busca */}
                  {searchHistory.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Buscas Recentes
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSearchHistory}
                          className="text-xs text-gray-500"
                        >
                          Limpar
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.map((historyItem, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setQuery(historyItem);
                              performSearch(historyItem);
                            }}
                            className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                          >
                            {historyItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Buscas em Tendência */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Tendências
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((trend, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            setQuery(trend);
                            performSearch(trend);
                          }}
                        >
                          {trend}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>

        {/* Conteúdo Principal */}
        {!hasSearched ? (
          /* Estado Inicial */
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Encontre o que você procura
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Use a busca acima para encontrar produtos, vendedores ou categorias específicas.
            </p>
            
            {/* Categorias Populares */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categorias Populares
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {mockCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/categories/${category.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow text-center"
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <h4 className="font-medium text-sm">{category.label}</h4>
                    <p className="text-xs text-gray-500">{category.count} produtos</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Resultados da Busca */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de Filtros */}
            <div className="lg:w-64 flex-shrink-0">
              <SearchFilters
                categories={mockCategories}
                sellers={mockSellers}
                priceRange={priceRange}
                maxPrice={500}
                selectedCategories={selectedCategories}
                selectedSellers={selectedSellers}
                selectedPriceRange={selectedPriceRange}
                onCategoryChange={handleCategoryChange}
                onSellerChange={handleSellerChange}
                onPriceRangeChange={setSelectedPriceRange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Resultados */}
            <div className="flex-1">
              <SearchResults
                products={paginatedProducts}
                query={query}
                totalResults={filteredProducts.length}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onSortChange={handleSortChange}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}