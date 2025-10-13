import { CategoryCard } from './CategoryCard';

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

interface CategoryGridProps {
  categories: Category[];
  variant?: 'default' | 'compact' | 'featured';
  showProductCount?: boolean;
  className?: string;
}

export function CategoryGrid({ 
  categories, 
  variant = 'default', 
  showProductCount = true,
  className = ''
}: CategoryGridProps) {
  const gridClasses = {
    default: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    compact: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4',
    featured: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma categoria encontrada
        </h3>
        <p className="text-gray-600">
          Não encontramos categorias para exibir no momento.
        </p>
      </div>
    );
  }

  return (
    <div className={`${gridClasses[variant]} ${className}`}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          variant={variant}
          showProductCount={showProductCount}
        />
      ))}
    </div>
  );
}