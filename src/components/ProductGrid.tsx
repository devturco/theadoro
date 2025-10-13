import React from 'react';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  emptyMessage?: string;
  skeletonCount?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  className,
  columns = 4,
  showQuickAdd = true,
  showWishlist = true,
  variant = 'default',
  emptyMessage = 'Nenhum produto encontrado.',
  skeletonCount = 8,
}) => {
  const gridClasses = cn(
    'grid gap-6',
    {
      'grid-cols-1 sm:grid-cols-2': columns === 2,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': columns === 3,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': columns === 4,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5': columns === 5,
    },
    className
  );

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} variant={variant} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500">
          Tente ajustar os filtros ou buscar por outros termos.
        </p>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showQuickAdd={showQuickAdd}
          showWishlist={showWishlist}
          variant={variant}
        />
      ))}
    </div>
  );
};

interface ProductCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured';
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ variant = 'default' }) => {
  const cardHeight = {
    default: 'h-96',
    compact: 'h-80',
    featured: 'h-[420px]',
  }[variant];

  const imageHeight = {
    default: 'h-48',
    compact: 'h-40',
    featured: 'h-56',
  }[variant];

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', cardHeight)}>
      {/* Image Skeleton */}
      <Skeleton className={cn('w-full', imageHeight)} />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-20" />
        
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Location */}
        <Skeleton className="h-3 w-24" />
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};