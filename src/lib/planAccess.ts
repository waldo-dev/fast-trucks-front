import { getCachedUser } from './auth';

export type PlanTier = 'BASIC' | 'STANDARD' | 'PRO';

type FeatureKey =
  | 'pos'
  | 'cash_shifts'
  | 'kitchen_print'
  | 'discounts'
  // | 'qr_menu' // Ignorado por ahora, según indicación
  | 'inventory_basic'
  | 'recipe_costing'
  | 'crm'
  | 'reports'
  | 'multi_registers'
  | 'pnl'
  | 'price_lists'
  | 'inventory_valued';

const FEATURES_BY_TIER: Record<PlanTier, FeatureKey[]> = {
  BASIC: ['pos', 'cash_shifts', 'kitchen_print', 'discounts'],
  STANDARD: [
    'pos',
    'cash_shifts',
    'kitchen_print',
    'discounts',
    'inventory_basic',
    'recipe_costing',
    'crm',
    'reports',
  ],
  PRO: [
    'pos',
    'cash_shifts',
    'kitchen_print',
    'discounts',
    'inventory_basic',
    'recipe_costing',
    'crm',
    'reports',
    'multi_registers',
    'pnl',
    'price_lists',
    'inventory_valued',
  ],
};

export const normalizeTier = (input?: string | number | null): PlanTier => {
  const num = Number(input);
  const txt = String(input ?? '').toLowerCase();
  if (txt.includes('basic') || num === 1) return 'BASIC';
  if (txt.includes('standard') || txt.includes('estandar') || txt.includes('estándar') || num === 2)
    return 'STANDARD';
  return 'PRO';
};

export const getCachedTier = (): PlanTier => {
  const cached = getCachedUser();
  if (cached?.subscriptionTier) return cached.subscriptionTier;
  if (cached?.subscriptionPlanName || cached?.subscriptionPlanId) {
    return normalizeTier(cached.subscriptionPlanName ?? cached.subscriptionPlanId);
  }
  return 'PRO';
};

export const hasFeature = (feature: FeatureKey, tier?: PlanTier): boolean => {
  const t = tier ?? getCachedTier();
  return FEATURES_BY_TIER[t]?.includes(feature) ?? false;
};

export const listFeaturesForTier = (tier?: PlanTier): FeatureKey[] => {
  const t = tier ?? getCachedTier();
  return FEATURES_BY_TIER[t] ?? [];
};







