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

export const useSiteSettings = (section?: string) => {
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('site_settings')
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
            // Don't toast on fetch error to avoid spamming public users if RLS fails silently
        } finally {
            setLoading(false);
        }
    }, [section]);

    const updateSetting = async (id: string, value: any, options: { showToast?: boolean } = { showToast: true }) => {
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({ value })
                .eq('id', id);

            if (error) throw error;

            setSettings(prev =>
                prev.map(item =>
                    item.id === id ? { ...item, value } : item
                )
            );

            if (options.showToast) {
                toast.success('Configuração atualizada com sucesso!');
            }
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
