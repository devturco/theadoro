import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
          .limit(4)
          .order('name');

        if (error) throw error;

        setCategories((data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug || '',
          image: cat.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000',
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

  if (isLoading) return <div className="py-20 text-center">Carregando categorias...</div>;
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-4">
            Explore Nossas Categorias
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De presentes clássicos a experiências únicas, encontre exatamente o que procura
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-square shadow-md hover:shadow-wine transition-all duration-500 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700"
                style={{ backgroundImage: `url(${category.image})` }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/40 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-2xl font-serif font-bold text-white mb-2 transform group-hover:translate-y-[-4px] transition-transform duration-300">
                  {category.name}
                </h3>
                <p className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
