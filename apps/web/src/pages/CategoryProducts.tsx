import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, SortAsc } from 'lucide-react';
import { ProductFilters } from '@/types/product';
import { Button } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@theadoro/ui';
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

import { supabase } from '@/integrations/supabase/client';

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});

  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  useEffect(() => {
    const loadCategoryData = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        // 1. Fetch Category by Slug
        const { data: categoryData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (catError) throw catError;
        if (!categoryData) {
          setCategory(null);
          return;
        }

        setCategory({
          ...categoryData,
          image: categoryData.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000&auto=format&fit=crop',
          productCount: 0
        });

        // 2. Fetch Products for this category
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select(`
            *,
            profiles (
              full_name
            )
          `)
          .eq('category_id', categoryData.id);

        if (prodError) {
          console.warn('Products fetch error:', prodError);
        } else {
          // Map to interface
          setProducts((productsData || []).map((p: any) => ({
            stock_quantity: p.stock_quantity || 0,
            in_stock: p.in_stock ?? (p.stock_quantity > 0),
            is_service: p.is_service || false,
            tags: p.tags || [],
            category: {
              id: p.category_id,
              name: categoryData.name,
              slug: categoryData.slug
            },
            id: p.id,
            name: p.name,
            price: p.price,
            original_price: p.original_price,
            image: p.image_url || 'https://placehold.co/400',
            images: p.images || [],
            rating: 5.0, // placeholder
            review_count: 0,
            sellerId: p.seller_id,
            sellerName: p.profiles?.full_name || 'Vendedor',
            categoryId: p.category_id,
            isWishlisted: false,
            seller: {
              id: p.seller_id,
              name: p.profiles?.full_name || 'Vendedor',
            }
          })));
        }

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryData();
  }, [slug]);

  // Placeholder for related products to avoid crash
  const relatedProducts: Product[] = [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h1>
          <p className="text-gray-600 mb-6">A categoria "{slug}" não existe.</p>
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
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                className="w-full"
              />
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {products.length > 0 && (
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
            )}

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