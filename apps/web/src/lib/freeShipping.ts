import type { Product } from '@/types/product';

export type FreeShippingRuleType = 'product' | 'campaign';

export interface FreeShippingRule {
  sourceId: string;
  sourceName: string;
  sourceType: FreeShippingRuleType;
  threshold: number;
  sellerId?: string;
}

interface ProductLike {
  id: string;
  name: string;
  seller_id: string;
  shipping_options?: Product['shipping_options'];
}

interface ItemLike {
  product: ProductLike;
}

interface CampaignLike {
  id: string;
  title: string;
  seller_id?: string;
  free_shipping_enabled?: boolean | null;
  free_shipping_threshold?: number | null;
}

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 200;

export const normalizeFreeShippingThreshold = (value: unknown): number | null => {
  const threshold = Number(value);

  if (!Number.isFinite(threshold) || threshold <= 0) {
    return null;
  }

  return threshold;
};

export const getProductFreeShippingRules = (items: ItemLike[]): FreeShippingRule[] => {
  const rules = new Map<string, FreeShippingRule>();

  items.forEach(({ product }) => {
    const shippingOptions = (product.shipping_options || {}) as Record<string, unknown>;
    const enabled = Boolean(shippingOptions.free_shipping_enabled);
    const threshold = normalizeFreeShippingThreshold(
      shippingOptions.free_shipping_threshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD
    );

    if (!enabled || !threshold) {
      return;
    }

    rules.set(product.id, {
      sourceId: product.id,
      sourceName: product.name,
      sourceType: 'product',
      threshold,
      sellerId: product.seller_id,
    });
  });

  return Array.from(rules.values());
};

export const getCampaignFreeShippingRules = (campaigns: CampaignLike[]): FreeShippingRule[] => {
  return campaigns
    .map((campaign) => {
      if (!campaign.free_shipping_enabled) {
        return null;
      }

      const threshold = normalizeFreeShippingThreshold(
        campaign.free_shipping_threshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD
      );

      if (!threshold) {
        return null;
      }

      const rule: FreeShippingRule = {
        sourceId: campaign.id,
        sourceName: campaign.title,
        sourceType: 'campaign',
        threshold,
        sellerId: campaign.seller_id,
      };

      return rule;
    })
    .filter((rule): rule is FreeShippingRule => Boolean(rule));
};

export const getAppliedFreeShippingRule = (
  subtotal: number,
  rules: FreeShippingRule[]
): FreeShippingRule | null => {
  const eligibleRules = rules
    .filter((rule) => subtotal >= rule.threshold)
    .sort((left, right) => left.threshold - right.threshold);

  return eligibleRules[0] || null;
};
