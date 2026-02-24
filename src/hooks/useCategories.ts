import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/product'; // Adjust path if needed, ensure Category type matches service
import { categoryService } from '@/services/category.service';
import { toast } from 'sonner';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Using getActiveCategories for general use, assuming most frontend needs active ones.
            // For admin, we might need a separate method or param.
            // Let's use getCategoriesWithProductCount or just base list. 
            // FilterSidebar uses getCategories (all?).
            // Let's use getActiveCategories by default for frontend safety.
            const { data, error } = await categoryService.getActiveCategories();
            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            setError(err.message);
            // toast.error('Erro ao carregar categorias'); // Optional: don't spam toasts on mount
        } finally {
            setLoading(false);
        }
    }, []);

    // For Admin: Fetch all including inactive
    const fetchAllCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await categoryService.getAll(); // BaseService method
            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            console.error('Error fetching all categories:', err);
            setError(err.message);
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const createCategory = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const { data: newCategory, error } = await categoryService.createWithSlug(data);
            if (error) throw error;
            setCategories(prev => [...prev, newCategory as Category]);
            toast.success('Categoria criada com sucesso!');
            return newCategory;
        } catch (err: any) {
            console.error('Error creating category:', err);
            toast.error(err.message || 'Erro ao criar categoria');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCategory = useCallback(async (id: string, data: any) => {
        setLoading(true);
        try {
            const { data: updatedCategory, error } = await categoryService.updateWithSlug(id, data);
            if (error) throw error;
            setCategories(prev => prev.map(c => c.id === id ? (updatedCategory as Category) : c));
            toast.success('Categoria atualizada com sucesso!');
            return updatedCategory;
        } catch (err: any) {
            console.error('Error updating category:', err);
            toast.error(err.message || 'Erro ao atualizar categoria');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCategory = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const { error } = await categoryService.delete(id);
            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Categoria removida com sucesso!');
        } catch (err: any) {
            console.error('Error deleting category:', err);
            toast.error(err.message || 'Erro ao remover categoria');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        refreshCategories: fetchCategories
    };
};
