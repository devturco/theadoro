import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/product';

export class CategoryService {
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: item.image,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parent_id: data.parent_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw error;
    }
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parent_id: data.parent_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

    } catch (error) {
      console.error('Error fetching category by id:', error);
      throw error;
    }
  }

  static async getMainCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: item.image,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

    } catch (error) {
      console.error('Error fetching main categories:', error);
      throw error;
    }
  }

  static async getSubCategories(parentId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: item.image,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  static async getCategoriesWithProductCount(): Promise<(Category & { productCount: number })[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products (count)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: item.image,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        productCount: item.products?.[0]?.count || 0,
      }));

    } catch (error) {
      console.error('Error fetching categories with product count:', error);
      throw error;
    }
  }

  static async getFeaturedCategories(limit: number = 6): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('featured', true)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: item.image,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

    } catch (error) {
      console.error('Error fetching featured categories:', error);
      throw error;
    }
  }

  static async searchCategories(query: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        image: item.image,
        parent_id: item.parent_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  }

  static async getCategoryHierarchy(): Promise<(Category & { children?: Category[] })[]> {
    try {
      // Get all categories
      const categories = await this.getCategories();
      
      // Build hierarchy
      const categoryMap = new Map<string, Category & { children?: Category[] }>();
      const rootCategories: (Category & { children?: Category[] })[] = [];

      // First pass: create map and identify root categories
      categories.forEach(category => {
        const categoryWithChildren = { ...category, children: [] };
        categoryMap.set(category.id, categoryWithChildren);
        
        if (!category.parent_id) {
          rootCategories.push(categoryWithChildren);
        }
      });

      // Second pass: build parent-child relationships
      categories.forEach(category => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          const child = categoryMap.get(category.id);
          
          if (parent && child) {
            parent.children!.push(child);
          }
        }
      });

      return rootCategories;

    } catch (error) {
      console.error('Error building category hierarchy:', error);
      throw error;
    }
  }
}