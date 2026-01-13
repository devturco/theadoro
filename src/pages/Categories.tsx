import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Grid, List } from 'lucide-react';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type definition matches DB now
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string; // Note: Database column is 'image_url' usually, check logic
  productCount: number;
  // subcategories support would need self-join or separate fetch, simplifying for now
  subcategories?: Category[];
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        // Fetch active categories
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        // Transform data slightly to match UI expectations (productCount placeholder)
        const transformedData = (data || []).map((cat: any) => ({
          ...cat,
          image: cat.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000&auto=format&fit=crop', // Fallback image
          productCount: 0, // TODO: Implement real count later
          subcategories: [] // TODO: Implement hierarchy later
        }));

        setCategories(transformedData);
        setFeaturedCategories(transformedData.slice(0, 3));
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erro ao carregar categorias.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const totalProducts = 0; // Placeholder until counts are real

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Nossas Categorias
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra uma ampla variedade de produtos e serviços organizados por categoria.
            Encontre exatamente o que você está procurando.
          </p>
          <div className="mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {totalProducts.toLocaleString()} produtos disponíveis
            </Badge>
          </div>
        </div>

        {/* Categorias em Destaque */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Categorias em Destaque</h2>
            <Button variant="outline" asChild>
              <Link to="/products" className="flex items-center gap-2">
                Ver todos os produtos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <CategoryGrid
            categories={featuredCategories}
            variant="featured"
            className="mb-8"
          />
        </section>

        <Separator className="my-12" />

        {/* Todas as Categorias */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Todas as Categorias</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Grid className="h-4 w-4 mr-2" />
                Grade
              </Button>
            </div>
          </div>

          <CategoryGrid categories={categories} />
        </section>

        {/* Seção de Subcategorias Populares */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Subcategorias Populares</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              category.subcategories && category.subcategories.length > 0 && (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.subcategories.slice(0, 4).map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/categories/${sub.slug}`}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium">{sub.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {sub.productCount}
                          </Badge>
                        </Link>
                      ))}
                      {category.subcategories.length > 4 && (
                        <Link
                          to={`/categories/${category.slug}`}
                          className="block text-center text-sm text-pink-600 hover:text-pink-700 font-medium mt-3"
                        >
                          Ver todas as subcategorias
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Não encontrou o que procura?
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Use nossa busca avançada para encontrar produtos específicos ou entre em contato conosco.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/search">
                    Buscar Produtos
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">
                    Fale Conosco
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}