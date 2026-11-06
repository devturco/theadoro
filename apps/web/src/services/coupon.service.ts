
import { supabase } from '@/integrations/supabase/client';
import { supabaseLoose } from '@/integrations/supabase/loose';
import { BaseService } from './base.service';

export interface Coupon {
    id: string;
    seller_id: string | null;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase: number;
    max_discount_value?: number;
    usage_limit?: number;
    used_count: number;
    starts_at: string;
    expiration_date?: string;
    is_active: boolean;
    created_at: string;
}

class CouponService extends BaseService<Coupon> {
    constructor() {
        super('coupons');
    }

    async getByCode(code: string, sellerId?: string) {
        let query = supabaseLoose
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true);

        if (sellerId) {
            query = query.or(`seller_id.eq.${sellerId},seller_id.is.null`);
        } else {
            query = query.is('seller_id', null);
        }

        const { data, error } = await query.maybeSingle();
        return { data: data as Coupon | null, error };
    }

    async getBySeller(sellerId: string) {
        const { data, error } = await supabaseLoose
            .from('coupons')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });
        return { data: data as Coupon[], error };
    }

    // Custom update with fallback to code+seller_id
    async updateStatus(coupon: Coupon, active: boolean) {
        let query = supabaseLoose.from('coupons').update({ is_active: active });
        
        if (coupon.id) {
            query = query.eq('id', coupon.id);
        } else {
            query = query.eq('code', coupon.code).eq('seller_id', coupon.seller_id);
        }

        return await query;
    }

    // Custom delete with fallback to code+seller_id
    async remove(coupon: Coupon) {
        let query = supabaseLoose.from('coupons').delete();
        
        if (coupon.id) {
            query = query.eq('id', coupon.id);
        } else {
            query = query.eq('code', coupon.code).eq('seller_id', coupon.seller_id);
        }

        return await query;
    }
}

export const couponService = new CouponService();
