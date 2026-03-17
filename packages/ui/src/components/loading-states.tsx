import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '../lib/utils';

interface LoadingStateProps {
  className?: string;
  children?: ReactNode;
}

// Full page loading
export const PageLoading = ({ className }: LoadingStateProps) => (
  <div className={cn(
    'min-h-screen flex items-center justify-center',
    className
  )}>
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Card loading skeleton
export const CardLoading = ({ className }: LoadingStateProps) => (
  <Card className={className}>
    <CardHeader>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </CardContent>
  </Card>
);

// Table loading skeleton
export const TableLoading = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// List loading skeleton
export const ListLoading = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Form loading skeleton
export const FormLoading = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);

// Dashboard metrics loading
export const MetricsLoading = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Product grid loading
export const ProductGridLoading = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <Skeleton className="h-48 w-full rounded-t-lg" />
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-5 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Inline loading for buttons and small components
export const InlineLoading = ({ 
  size = 'sm', 
  text = 'Carregando...',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}) => (
  <div className={cn('flex items-center gap-2', className)}>
    <LoadingSpinner size={size} />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

// Content loading wrapper
export const ContentLoading = ({ 
  loading, 
  children, 
  fallback,
  className 
}: {
  loading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}) => {
  if (loading) {
    return (
      <div className={className}>
        {fallback || <InlineLoading />}
      </div>
    );
  }

  return <>{children}</>;
};