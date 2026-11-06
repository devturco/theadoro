import { supabase } from '@/integrations/supabase/client';
import { supabaseLoose } from '@/integrations/supabase/loose';
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export class BaseService<T extends BaseEntity> {
  protected tableName: string;
  protected realtimeChannel: RealtimeChannel | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get all records with optional pagination and filtering
   */
  async getAll(
    options: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<{ data: T[]; count: number; error: PostgrestError | null }> {
    try {
      let query = supabaseLoose
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && key.includes('search')) {
            query = query.ilike(key.replace('_search', ''), `%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.page && options.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      return {
        data: data as T[] || [],
        count: count || 0,
        error
      };
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return {
        data: [],
        count: 0,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabaseLoose
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      return {
        data: data as T,
        error
      };
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by ID:`, error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const { data: result, error } = await supabaseLoose
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      return {
        data: result as T,
        error
      };
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabaseLoose
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return {
        data: result as T,
        error
      };
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabaseLoose
        .from(this.tableName)
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return { error: error as PostgrestError };
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(
    callback: (payload: any) => void,
    filter?: string
  ): RealtimeChannel {
    if (this.realtimeChannel) {
      this.unsubscribeFromChanges();
    }

    let channel = supabase
      .channel(`${this.tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter: filter
        },
        callback
      );

    channel.subscribe();
    this.realtimeChannel = channel;
    
    return channel;
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribeFromChanges(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  /**
   * Execute a custom query
   */
  async executeQuery(queryBuilder: (query: any) => any): Promise<{ data: any; error: PostgrestError | null }> {
    try {
      const query = supabaseLoose.from(this.tableName).select('*');
      const { data, error } = await queryBuilder(query);

      return {
        data,
        error
      };
    } catch (error) {
      console.error(`Error executing custom query on ${this.tableName}:`, error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Count records with optional filters
   */
  async count(filters: FilterOptions = {}): Promise<{ count: number; error: PostgrestError | null }> {
    try {
      let query = supabaseLoose
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      return {
        count: count || 0,
        error
      };
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      return {
        count: 0,
        error: error as PostgrestError
      };
    }
  }

  /**
   * Batch operations
   */
  async batchCreate(items: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabaseLoose
        .from(this.tableName)
        .insert(items)
        .select();

      return {
        data: data as T[],
        error
      };
    } catch (error) {
      console.error(`Error batch creating ${this.tableName}:`, error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  async batchUpdate(updates: { id: string; data: Partial<Omit<T, 'id' | 'created_at'>> }[]): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    try {
      const promises = updates.map(({ id, data }) => this.update(id, data));
      const results = await Promise.all(promises);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        return {
          data: null,
          error: errors[0].error
        };
      }

      return {
        data: results.map(result => result.data).filter(Boolean) as T[],
        error: null
      };
    } catch (error) {
      console.error(`Error batch updating ${this.tableName}:`, error);
      return {
        data: null,
        error: error as PostgrestError
      };
    }
  }

  async batchDelete(ids: string[]): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabaseLoose
        .from(this.tableName)
        .delete()
        .in('id', ids);

      return { error };
    } catch (error) {
      console.error(`Error batch deleting ${this.tableName}:`, error);
      return { error: error as PostgrestError };
    }
  }
}