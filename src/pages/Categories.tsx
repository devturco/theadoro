import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Grid, List } from 'lucide-react';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  parentId?: string;
  subcategories?: Category[];
}

// Mock data para demonstração
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Presentes',
    slug: 'presentes',
    description: 'Presentes especiais para todas as ocasiões',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20gift%20boxes%20with%20ribbons%20and%20bows%20colorful%20presents%20celebration&image_size=square_hd',
    productCount: 245,
    subcategories: [
      { id: '1a', name: 'Aniversário', slug: 'aniversario', productCount: 89, parentId: '1' },
      { id: '1b', name: 'Casamento', slug: 'casamento', productCount: 67, parentId: '1' },
      { id: '1c', name: 'Dia das Mães', slug: 'dia-das-maes', productCount: 45, parentId: '1' },
      { id: '1d', name: 'Natal', slug: 'natal', productCount: 44, parentId: '1' }
    ]
  },
  {
    id: '2',
    name: 'Flores & Cestas',
    slug: 'flores-cestas',
    description: 'Arranjos florais e cestas de presente',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20flower%20arrangements%20and%20gift%20baskets%20colorful%20flowers%20elegant%20presentation&image_size=square_hd',
    productCount: 156,
    subcategories: [
      { id: '2a', name: 'Buquês', slug: 'buques', productCount: 78, parentId: '2' },
      { id: '2b', name: 'Arranjos', slug: 'arranjos', productCount: 45, parentId: '2' },
      { id: '2c', name: 'Cestas Gourmet', slug: 'cestas-gourmet', productCount: 33, parentId: '2' }
    ]
  },
  {
    id: '3',
    name: 'Moda',
    slug: 'moda',
    description: 'Roupas e acessórios da moda',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20clothing%20and%20accessories%20stylish%20modern%20wardrobe%20elegant%20display&image_size=square_hd',
    productCount: 189,
    subcategories: [
      { id: '3a', name: 'Roupas Femininas', slug: 'roupas-femininas', productCount: 89, parentId: '3' },
      { id: '3b', name: 'Roupas Masculinas', slug: 'roupas-masculinas', productCount: 67, parentId: '3' },
      { id: '3c', name: 'Acessórios', slug: 'acessorios', productCount: 33, parentId: '3' }
    ]
  },
  {
    id: '4',
    name: 'Beleza & Bem-estar',
    slug: 'beleza-bem-estar',
    description: 'Produtos de beleza e cuidados pessoais',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20and%20wellness%20products%20cosmetics%20skincare%20spa%20elegant%20arrangement&image_size=square_hd',
    productCount: 134,
    subcategories: [
      { id: '4a', name: 'Skincare', slug: 'skincare', productCount: 56, parentId: '4' },
      { id: '4b', name: 'Maquiagem', slug: 'maquiagem', productCount: 45, parentId: '4' },
      { id: '4c', name: 'Perfumes', slug: 'perfumes', productCount: 33, parentId: '4' }
    ]
  },
  {
    id: '5',
    name: 'Serviços',
    slug: 'servicos',
    description: 'Serviços especializados e consultorias',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20services%20consultation%20business%20meeting%20modern%20office&image_size=square_hd',
    productCount: 78,
    subcategories: [
      { id: '5a', name: 'Consultoria', slug: 'consultoria', productCount: 34, parentId: '5' },
      { id: '5b', name: 'Design', slug: 'design', productCount: 25, parentId: '5' },
      { id: '5c', name: 'Fotografia', slug: 'fotografia', productCount: 19, parentId: '5' }
    ]
  },
  {
    id: '6',
    name: 'Experiências',
    slug: 'experiencias',
    description: 'Experiências únicas e memoráveis',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=unique%20experiences%20adventure%20travel%20memorable%20moments%20lifestyle&image_size=square_hd',
    productCount: 92,
    subcategories: [
      { id: '6a', name: 'Viagens', slug: 'viagens', productCount: 45, parentId: '6' },
      { id: '6b', name: 'Gastronomia', slug: 'gastronomia', productCount: 28, parentId: '6' },
      { id: '6c', name: 'Aventura', slug: 'aventura', productCount: 19, parentId: '6' }
    ]
  }
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadCategories = async () => {
      setIsLoading(true);
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCategories(mockCategories);
      setFeaturedCategories(mockCategories.slice(0, 3));
      setIsLoading(false);
    };

    loadCategories();
  }, []);

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          
          {/* Categories Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
            ))}
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