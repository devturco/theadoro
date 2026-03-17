import { Link } from 'react-router-dom';
import { Card, CardContent } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';

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

interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'compact' | 'featured';
  showProductCount?: boolean;
}

export function CategoryCard({ 
  category, 
  variant = 'default', 
  showProductCount = true 
}: CategoryCardProps) {
  const cardClasses = {
    default: 'h-64 group hover:shadow-lg transition-all duration-300',
    compact: 'h-40 group hover:shadow-md transition-all duration-300',
    featured: 'h-80 group hover:shadow-xl transition-all duration-300'
  };

  const imageClasses = {
    default: 'h-40',
    compact: 'h-24',
    featured: 'h-52'
  };

  return (
    <Link to={`/categories/${category.slug}`} className="block">
      <Card className={cardClasses[variant]}>
        <CardContent className="p-0 h-full flex flex-col">
          {/* Imagem da Categoria */}
          <div className={`${imageClasses[variant]} bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden rounded-t-lg`}>
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-30">🎁</div>
              </div>
            )}
            
            {/* Overlay com contador de produtos */}
            {showProductCount && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-white/90 text-gray-700">
                  {category.productCount} produtos
                </Badge>
              </div>
            )}
          </div>

          {/* Conteúdo da Categoria */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-pink-600 transition-colors">
                {category.name}
              </h3>
              {category.description && variant !== 'compact' && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>

            {/* Subcategorias (apenas para variant featured) */}
            {variant === 'featured' && category.subcategories && category.subcategories.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {category.subcategories.slice(0, 3).map((sub) => (
                    <Badge key={sub.id} variant="outline" className="text-xs">
                      {sub.name}
                    </Badge>
                  ))}
                  {category.subcategories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.subcategories.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}