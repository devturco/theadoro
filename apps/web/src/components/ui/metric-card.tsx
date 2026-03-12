import React, { ReactNode, ComponentType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: any;
  trend?: {
    value: number;
    label?: string;
    period?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  loading = false,
  className,
  onClick
}: MetricCardProps) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format currency if it looks like a price
      if (val > 1000 && title.toLowerCase().includes('receita')) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      }

      // Format large numbers
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }

      return val.toLocaleString('pt-BR');
    }
    return String(val);
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.value > 0) {
      return <TrendingUp className="h-3 w-3" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="h-3 w-3" />;
    }
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';

    if (trend.value > 0) {
      return 'text-green-600';
    } else if (trend.value < 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'destructive':
        return 'border-red-200 bg-red-50';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md',
        getVariantStyles(),
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-muted-foreground">
              {(() => {
                if (!icon) return null;
                if (React.isValidElement(icon)) return icon;
                if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
                  const IconComponent = icon as any;
                  return <IconComponent className="h-4 w-4" />;
                }
                return null;
              })()}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            {description && (
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md',
        getVariantStyles(),
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {(() => {
              if (!icon) return null;
              if (React.isValidElement(icon)) return icon;
              if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
                const IconComponent = icon as any;
                return <IconComponent className="h-4 w-4" />;
              }
              return null;
            })()}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatValue(value)}
          </div>

          <div className="flex items-center justify-between">
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}

            {trend && (
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  <span className="ml-1">
                    {Math.abs(trend.value)}%
                  </span>
                </Badge>
                {trend.period && (
                  <span className="text-xs text-muted-foreground">
                    {trend.period}
                  </span>
                )}
              </div>
            )}
          </div>

          {trend?.label && (
            <p className="text-xs text-muted-foreground">
              {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};