import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ProductGrid } from '@/components/ProductGrid';
import { FilterSidebar } from '@/components/FilterSidebar';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ProductCarousel } from '@/components/ProductCarousel';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  parentId?: string;
  subcategories?: Category[];
  parent?: Category;
}

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

// Mock data
const mockCategories: Record<string, Category> = {
  'presentes': {
    id: '1',
    name: 'Presentes',
    slug: 'presentes',
    description: 'Presentes especiais para todas as ocasiões. Encontre o presente perfeito para quem você ama.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20gift%20boxes%20with%20ribbons%20and%20bows%20colorful%20presents%20celebration&image_size=landscape_16_9',
    productCount: 245,
    subcategories: [
      { id: '1a', name: 'Aniversário', slug: 'aniversario', productCount: 89, parentId: '1' },
      { id: '1b', name: 'Casamento', slug: 'casamento', productCount: 67, parentId: '1' },
      { id: '1c', name: 'Dia das Mães', slug: 'dia-das-maes', productCount: 45, parentId: '1' },
      { id: '1d', name: 'Natal', slug: 'natal', productCount: 44, parentId: '1' }
    ]
  },
  'aniversario': {
    id: '1a',
    name: 'Aniversário',
    slug: 'aniversario',
    description: 'Presentes especiais para celebrar aniversários inesquecíveis.',
    productCount: 89,
    parentId: '1',
    parent: {
      id: '1',
      name: 'Presentes',
      slug: 'presentes',
      productCount: 245
    }
  },
  'flores-cestas': {
    id: '2',
    name: 'Flores & Cestas',
    slug: 'flores-cestas',
    description: 'Arranjos florais e cestas de presente para todas as ocasiões.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20flower%20arrangements%20and%20gift%20baskets%20colorful%20flowers%20elegant%20presentation&image_size=landscape_16_9',
    productCount: 156,
    subcategories: [
      { id: '2a', name: 'Buquês', slug: 'buques', productCount: 78, parentId: '2' },
      { id: '2b', name: 'Arranjos', slug: 'arranjos', productCount: 45, parentId: '2' },
      { id: '2c', name: 'Cestas Gourmet', slug: 'cestas-gourmet', productCount: 33, parentId: '2' }
    ]
  }
};

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
  }
];

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadCategoryData = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const categoryData = mockCategories[slug];
      if (categoryData) {
        setCategory(categoryData);
        // Filtrar produtos da categoria
        const categoryProducts = mockProducts.filter(p => 
          p.categoryId === categoryData.id || 
          (categoryData.parentId && p.categoryId === categoryData.parentId)
        );
        setProducts(categoryProducts);
        
        // Produtos relacionados (outras categorias)
        const related = mockProducts.filter(p => 
          p.categoryId !== categoryData.id && 
          (!categoryData.parentId || p.categoryId !== categoryData.parentId)
        ).slice(0, 4);
        setRelatedProducts(related);
      }
      
      setIsLoading(false);
    };

    loadCategoryData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
          
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          
          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h1>
          <p className="text-gray-600 mb-6">A categoria que você está procurando não existe.</p>
          <Button asChild>
            <Link to="/categories">Ver todas as categorias</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/categories">Categorias</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {category.parent && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/categories/${category.parent.slug}`}>
                      {category.parent.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header da Categoria */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/categories" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>

          {/* Banner da Categoria */}
          {category.image && (
            <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {category.productCount} produtos
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {!category.image && (
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {category.name}
              </h1>
              <Badge variant="secondary">
                {category.productCount} produtos
              </Badge>
            </div>
          )}

          {category.description && (
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </div>

        {/* Subcategorias */}
        {category.subcategories && category.subcategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subcategorias</h2>
            <CategoryGrid 
              categories={category.subcategories} 
              variant="compact"
              showProductCount={true}
            />
          </section>
        )}

        {/* Controles e Filtros */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
            
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <FilterSidebar />
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Header dos Produtos */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Produtos em {category.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-gray-500" />
                <select className="border rounded-md px-3 py-2 text-sm">
                  <option value="relevance">Mais Relevantes</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="rating">Melhor Avaliação</option>
                </select>
              </div>
            </div>

            {/* Grid de Produtos */}
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600">
                  Não há produtos disponíveis nesta categoria no momento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <ProductCarousel
              products={relatedProducts}
              title="Você também pode gostar"
              subtitle="Produtos de outras categorias que podem interessar"
            />
          </section>
        )}

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-8 border border-pink-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Não encontrou o que procura?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Explore outras categorias ou use nossa busca para encontrar produtos específicos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/search">Buscar Produtos</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/categories">Ver Todas as Categorias</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}