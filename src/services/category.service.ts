import { BaseService, BaseEntity } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  image_url?: string;
  status: 'active' | 'inactive';
  parent_id?: string;
  sort_order?: number;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  // Relations
  parent?: Category;
  children?: Category[];
  product_count?: number;
}

export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  categories_with_products: number;
  top_category_by_products: {
    name: string;
    product_count: number;
  } | null;
}

class CategoryService extends BaseService<Category> {
  constructor() {
    super('categories');
  }

  /**
   * Get categories with product count
   */
  async getCategoriesWithProductCount(): Promise<{ data: Category[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_count:products(count)
        `)
        .order('sort_order', { ascending: true });

      return {
        data: data as Category[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting categories with product count:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get category hierarchy (parent-child relationships)
   */
  async getCategoryHierarchy(): Promise<{ data: Category[]; error: PostgrestError | null }> {
    try {
      // Get all categories
      const { data: allCategories, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        return { data: [], error };
      }

      // Build hierarchy
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create map of all categories
      allCategories?.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // Second pass: build hierarchy
      allCategories?.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!;
        
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      return {
        data: rootCategories,
        error: null
      };
    } catch (error) {
      console.error('Error getting category hierarchy:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<{ data: CategoryStats | null; error: PostgrestError | null }> {
    try {
      // Get total categories
      const { count: totalCategories, error: totalError } = await this.count();
      if (totalError) throw totalError;

      // Get active categories
      const { count: activeCategories, error: activeError } = await this.count({ status: 'active' });
      if (activeError) throw activeError;

      // Get categories with products
      const { data: categoriesWithProducts, error: withProductsError } = await supabase
        .from('products')
        .select('category_id')
        .not('category_id', 'is', null);

      if (withProductsError) throw withProductsError;

      const uniqueCategoryIds = new Set(categoriesWithProducts?.map(p => p.category_id));
      const categoriesWithProductsCount = uniqueCategoryIds.size;

      // Get top category by product count
      const { data: topCategoryData, error: topCategoryError } = await supabase
        .from('products')
        .select(`
          category_id,
          category:categories(name)
        `)
        .not('category_id', 'is', null);

      if (topCategoryError) throw topCategoryError;

      let topCategory = null;
      if (topCategoryData && topCategoryData.length > 0) {
        const categoryProductCounts = topCategoryData.reduce((acc, item) => {
          const categoryId = item.category_id;
          const categoryName = item.category?.name;
          if (categoryId && categoryName) {
            acc[categoryId] = {
              name: categoryName,
              count: (acc[categoryId]?.count || 0) + 1
            };
          }
          return acc;
        }, {} as Record<string, { name: string; count: number }>);

        const topCategoryEntry = Object.values(categoryProductCounts)
          .sort((a, b) => b.count - a.count)[0];

        if (topCategoryEntry) {
          topCategory = {
            name: topCategoryEntry.name,
            product_count: topCategoryEntry.count
          };
        }
      }

      const stats: CategoryStats = {
        total_categories: totalCategories,
        active_categories: activeCategories,
        categories_with_products: categoriesWithProductsCount,
        top_category_by_products: topCategory
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting category stats:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  /**
   * Get active categories only
   */
  async getActiveCategories(): Promise<{ data: Category[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      return {
        data: data as Category[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting active categories:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get subcategories of a parent category
   */
  async getSubcategories(parentId: string): Promise<{ data: Category[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('parent_id', parentId)
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      return {
        data: data as Category[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting subcategories:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(): Promise<{ data: Category[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .is('parent_id', null)
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      return {
        data: data as Category[] || [],
        error
      };
    } catch (error) {
      console.error('Error getting root categories:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Toggle category status
   */
  async toggleCategoryStatus(categoryId: string): Promise<{ data: Category | null; error: PostgrestError | null }> {
    try {
      // First get current status
      const { data: currentCategory, error: fetchError } = await this.getById(categoryId);
      if (fetchError || !currentCategory) {
        return { data: null, error: fetchError };
      }

      const newStatus = currentCategory.status === 'active' ? 'inactive' : 'active';

      return this.update(categoryId, { status: newStatus });
    } catch (error) {
      console.error('Error toggling category status:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Update category sort order
   */
  async updateSortOrder(categoryId: string, sortOrder: number): Promise<{ data: Category | null; error: PostgrestError | null }> {
    return this.update(categoryId, { sort_order: sortOrder });
  }

  /**
   * Generate unique slug from name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Check if slug is unique
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<{ isUnique: boolean; error: PostgrestError | null }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        return { isUnique: false, error };
      }

      return { isUnique: !data || data.length === 0, error: null };
    } catch (error) {
      console.error('Error checking slug uniqueness:', error);
      return { isUnique: false, error: error as PostgrestError };
    }
  }

  /**
   * Create category with unique slug
   */
  async createWithSlug(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'slug'>): Promise<{ data: Category | null; error: PostgrestError | null }> {
    try {
      let slug = this.generateSlug(categoryData.name);
      let counter = 1;

      // Ensure slug is unique
      while (true) {
        const { isUnique, error } = await this.isSlugUnique(slug);
        if (error) {
          return { data: null, error };
        }

        if (isUnique) {
          break;
        }

        slug = `${this.generateSlug(categoryData.name)}-${counter}`;
        counter++;
      }

      return this.create({ ...categoryData, slug });
    } catch (error) {
      console.error('Error creating category with slug:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Update category with slug validation
   */
  async updateWithSlug(categoryId: string, categoryData: Partial<Omit<Category, 'id' | 'created_at'>>): Promise<{ data: Category | null; error: PostgrestError | null }> {
    try {
      let updateData = { ...categoryData };

      // If name is being updated, generate new slug
      if (categoryData.name) {
        let slug = this.generateSlug(categoryData.name);
        let counter = 1;

        // Ensure slug is unique (excluding current category)
        while (true) {
          const { isUnique, error } = await this.isSlugUnique(slug, categoryId);
          if (error) {
            return { data: null, error };
          }

          if (isUnique) {
            break;
          }

          slug = `${this.generateSlug(categoryData.name)}-${counter}`;
          counter++;
        }

        updateData.slug = slug;
      }

      return this.update(categoryId, updateData);
    } catch (error) {
      console.error('Error updating category with slug:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<{ data: Category | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      return {
        data: data as Category,
        error
      };
    } catch (error) {
      console.error('Error getting category by slug:', error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Search categories
   */
  async searchCategories(searchTerm: string): Promise<{ data: Category[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('status', 'active')
        .order('name', { ascending: true });

      return {
        data: data as Category[] || [],
        error
      };
    } catch (error) {
      console.error('Error searching categories:', error);
      return {
        data: [],
        error: error as PostgrestError
      };
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryOrders: { id: string; sort_order: number }[]): Promise<{ error: PostgrestError | null }> {
    try {
      const updates = categoryOrders.map(({ id, sort_order }) => 
        this.update(id, { sort_order })
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        return { error: errors[0].error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error reordering categories:', error);
      return { error: error as PostgrestError };
    }
  }
}

export const categoryService = new CategoryService();