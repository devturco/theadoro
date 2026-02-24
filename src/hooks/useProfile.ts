
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user.service';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProfile() {
    const { user, profile, updateProfile: authUpdateProfile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activity, setActivity] = useState<{
        wishlist_count: number;
        reviews_count: number;
    } | null>(null);

    const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
        try {
            setLoading(true);
            await authUpdateProfile(data);
            toast.success('Perfil atualizado com sucesso');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [authUpdateProfile]);

    const updateAvatar = useCallback(async (file: File) => {
        if (!user) return;

        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            await authUpdateProfile({ avatar_url: publicUrl });
            toast.success('Avatar atualizado com sucesso');
            return publicUrl;
        } catch (error: any) {
            console.error('Error updating avatar:', error);
            toast.error('Erro ao atualizar avatar');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, authUpdateProfile]);

    const fetchActivity = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch wishlist count
            const { count: wishlistCount, error: wishError } = await supabase
                .from('wishlist')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (wishError) throw wishError;

            // TODO: Fetch reviews count when reviews table is ready
            const reviewsCount = 0;

            setActivity({
                wishlist_count: wishlistCount || 0,
                reviews_count: reviewsCount
            });
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    }, [user]);

    return {
        user,
        profile,
        loading,
        activity,
        updateProfile,
        updateAvatar,
        fetchActivity,
        refreshProfile
    };
}
