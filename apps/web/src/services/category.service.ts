import { BaseService, BaseEntity } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { supabaseLoose } from '@/integrations/supabase/loose';
import { PostgrestError } from '@supabase/supabase-js';

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean; // Changed from status
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

  // ... existing methods ...

  /**
   * Get category stats
   */
  async getCategoryStats(): Promise<{ data: CategoryStats | null; error: PostgrestError | null }> {
    try {
      // Get total categories
      const { count: totalCategories, error: totalError } = await this.count();
      if (totalError) throw totalError;

      // Get active categories
      const { count: activeCategories, error: activeError } = await this.count({ is_active: true });
      if (activeError) throw activeError;

      // Conta produtos por categoria em uma única leitura e agrega aqui.
      const { data: productRows, error: productsError } = await supabaseLoose
        .from('products')
        .select('category_id')
        .not('category_id', 'is', null);

      if (productsError) throw productsError;

      const productsByCategory = new Map<string, number>();
      for (const row of productRows || []) {
        const id = (row as { category_id: string | null }).category_id;
        if (!id) continue;
        productsByCategory.set(id, (productsByCategory.get(id) || 0) + 1);
      }

      const categoriesWithProductsCount = productsByCategory.size;

      let topCategory: CategoryStats['top_category_by_products'] = null;
      if (categoriesWithProductsCount > 0) {
        const [topId, topCount] = [...productsByCategory.entries()]
          .sort((a, b) => b[1] - a[1])[0];
        const { data: top } = await supabaseLoose
          .from('categories')
          .select('name')
          .eq('id', topId)
          .maybeSingle();
        topCategory = { name: (top as { name?: string } | null)?.name || 'Sem nome', product_count: topCount };
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
      const { data, error } = await supabaseLoose
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
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
      const { data, error } = await supabaseLoose
        .from(this.tableName)
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
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
      const { data, error } = await supabaseLoose
        .from(this.tableName)
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
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

      const newStatus = !currentCategory.is_active;

      return this.update(categoryId, { is_active: newStatus });
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
      let query = supabaseLoose
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
      const { data, error } = await supabaseLoose
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
      const { data, error } = await supabaseLoose
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
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