import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
  description?: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .limit(6)
          .order('name');

        if (error) throw error;

        setCategories((data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug || '',
          image: cat.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800',
          description: cat.description
        })));
      } catch (error) {
        console.error('Error loading home categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (isLoading) {
    return (
      <section className="py-10 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-28 sm:h-36" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-gray-900">
              Explore Categorias
            </h2>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">
              De presentes clássicos a experiências únicas
            </p>
          </div>
          <Link
            to="/categories"
            className="flex items-center gap-1 text-sm font-semibold text-wine hover:underline"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Grid — mobile: 2 cols compact, tablet: 3 cols, desktop: 6 cols */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.07] shadow-[0_1px_2px_hsl(346_25%_12%/0.05)] transition-all duration-300 hover:shadow-[0_2px_4px_hsl(346_25%_12%/0.06),0_14px_28px_-14px_hsl(346_25%_12%/0.22)] active:scale-[0.98]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Fixed-height image container — NOT aspect-square on mobile */}
              <div className="relative h-28 sm:h-36 lg:h-44 overflow-hidden bg-gray-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />

                {/* Strong overlay for legibility — always visible, darker at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                {/* Category name — always visible at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm leading-tight drop-shadow-sm">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-white/75 text-[9px] sm:text-[10px] mt-0.5 line-clamp-1 hidden sm:block">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
