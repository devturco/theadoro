import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@theadoro/ui';
import { Badge } from '@theadoro/ui';
import { Button } from '@theadoro/ui';
import { cn } from '@/lib/utils';

interface Seller {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  location: string;
  verified: boolean;
  specialties: string[];
  responseTime: string;
  joinedAt: string;
  productCount?: number;
  mainCategory?: string;
}

interface SellerCardProps {
  seller: Seller;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  showContact?: boolean;
}

export const SellerCard: React.FC<SellerCardProps> = ({
  seller,
  className,
  variant = 'default',
  showContact = true,
}) => {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
      isFeatured && "border-2 border-primary/20 shadow-md",
      className
    )}>
      {/* Cover Image */}
      {!isCompact && (
        <div className="relative h-32 bg-gradient-to-r from-primary/10 to-primary/5">
          {seller.coverImage ? (
            <img
              src={seller.coverImage}
              alt={`${seller.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
          )}

          {/* Verified Badge */}
          {seller.verified && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verificado
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className={cn("p-4", isCompact && "p-3")}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0",
            !isCompact && "-mt-8 relative z-10"
          )}>
            <div className={cn(
              "rounded-full border-4 border-white bg-gray-100 overflow-hidden",
              isCompact ? "w-12 h-12" : "w-16 h-16"
            )}>
              {seller.avatar ? (
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className={cn(
                    "font-semibold text-primary",
                    isCompact ? "text-sm" : "text-lg"
                  )}>
                    {seller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/sellers/${seller.id}`}
                  className="block hover:text-primary transition-colors"
                >
                  <h3 className={cn(
                    "font-semibold truncate",
                    isCompact ? "text-sm" : "text-lg"
                  )}>
                    {seller.name}
                    {seller.verified && isCompact && (
                      <CheckCircle className="w-4 h-4 text-green-600 inline ml-1" />
                    )}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground italic mt-0.5">
                  {seller.mainCategory || "Vendedor Especialista"}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex items-center">
                    <Star className={cn(
                      "text-yellow-400 fill-current",
                      isCompact ? "w-3 h-3" : "w-4 h-4"
                    )} />
                    <span className={cn(
                      "font-medium ml-1",
                      isCompact ? "text-xs" : "text-sm"
                    )}>
                      {seller.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className={cn(
                    "text-gray-500",
                    isCompact ? "text-xs" : "text-sm"
                  )}>
                    ({seller.reviewCount} avaliações)
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {!isCompact && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {seller.description}
              </p>
            )}

            {/* Location & Response Time */}
            <div className={cn(
              "flex flex-wrap gap-2 mb-3",
              isCompact && "mb-2"
            )}>
              <div className="flex items-center text-gray-500">
                <MapPin className={cn(
                  isCompact ? "w-3 h-3" : "w-4 h-4"
                )} />
                <span className={cn(
                  "ml-1",
                  isCompact ? "text-xs" : "text-sm"
                )}>
                  {seller.location}
                </span>
              </div>

              <div className="flex items-center text-gray-500">
                <Clock className={cn(
                  isCompact ? "w-3 h-3" : "w-4 h-4"
                )} />
                <span className={cn(
                  "ml-1",
                  isCompact ? "text-xs" : "text-sm"
                )}>
                  Responde em {seller.responseTime}
                </span>
              </div>
            </div>

            {/* Specialties */}
            {!isCompact && seller.specialties.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {seller.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {seller.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{seller.specialties.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Product Count */}
            {seller.productCount !== undefined && (
              <p className={cn(
                "text-gray-500 mb-3",
                isCompact ? "text-xs" : "text-sm"
              )}>
                {seller.productCount} {seller.productCount === 1 ? 'produto' : 'produtos'}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" asChild className="w-full">
                <Link to={`/sellers/${seller.id}`}>
                  Ver Perfil
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerCard;