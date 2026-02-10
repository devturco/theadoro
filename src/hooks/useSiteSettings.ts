import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteSetting {
    id: string;
    section: string;
    key: string;
    value: any;
    label: string;
    type: 'text' | 'image' | 'number' | 'boolean' | 'color' | 'image_array';
}

export interface CreateSiteSettingContext {
    key: string;
    value: any;
    label: string;
    section: string;
    type?: SiteSetting['type'];
}

export const useSiteSettings = (section?: string) => {
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('[useSiteSettings] Fetch exceeding 4s, forcing load false');
                setLoading(false);
            }
        }, 4000);

        try {
            setLoading(true);
            let query = (supabase.from as any)('site_settings')
                .select('*')
                .order('created_at', { ascending: true });

            if (section) {
                query = query.eq('section', section);
            }

            const { data, error } = await query;

            if (error) throw error;

            setSettings(data || []);
        } catch (error) {
            console.error('Error fetching site settings:', error);
        } finally {
            setLoading(false);
            clearTimeout(timeoutId);
        }
    }, [section]);

    const updateSetting = async (id: string | null, value: any, options: { showToast?: boolean, createIfMissing?: CreateSiteSettingContext } = { showToast: true }) => {
        try {
            let error;
            let newId = id;

            if (!id && options.createIfMissing) {
                // Create new setting
                const { data, error: createError } = await (supabase.from as any)('site_settings')
                    .insert({
                        key: options.createIfMissing.key,
                        value: value, // Use the passed value, not the one in context which might be default
                        label: options.createIfMissing.label,
                        section: options.createIfMissing.section,
                        type: options.createIfMissing.type || 'text'
                    })
                    .select()
                    .single();

                error = createError;
                if (data) newId = data.id;
            } else if (id) {
                // Update existing
                const { error: updateError } = await (supabase.from as any)('site_settings')
                    .update({ value })
                    .eq('id', id);
                error = updateError;
            } else {
                throw new Error('ID is missing and no create context provided');
            }

            if (error) throw error;

            // Refetch to ensure all state is synced, especially for new items
            fetchSettings();

            if (options.showToast) {
                toast.success('Configuração atualizada com sucesso!');
            }
            return newId;
        } catch (error) {
            console.error('Error updating setting:', error);
            if (options.showToast) {
                toast.error('Erro ao atualizar configuração');
            }
            throw error;
        }
    };

    const getSettingValue = useCallback((key: string, defaultValue: any = '') => {
        const setting = settings.find(s => s.key === key);
        // Remove quotes if the value came as a JSON string containing a string
        if (setting?.value && typeof setting.value === 'string' && setting.value.startsWith('"') && setting.value.endsWith('"')) {
            return setting.value.slice(1, -1);
        }
        return setting?.value ?? defaultValue;
    }, [settings]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        settings,
        loading,
        updateSetting,
        refetch: fetchSettings,
        getSettingValue
    };
};
