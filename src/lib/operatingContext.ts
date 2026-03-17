import { getCachedUser } from './auth';
import { normalizeTier, PlanTier } from './planAccess';
import { OPERATING_CONTEXT_KEY } from './storageKeys';

export type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string; planTier?: PlanTier; business_name?: string }
  | null;

const STORAGE_KEY = OPERATING_CONTEXT_KEY;
export const OPERATING_CONTEXT_EVENT = 'business-operating-context-updated';

const dispatchOperatingContextChange = (ctx: OperatingContext) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<OperatingContext | null>(OPERATING_CONTEXT_EVENT, {
      detail: ctx ?? null,
    })
  );
};

export const watchOperatingContext = (handler: (ctx: OperatingContext) => void) => {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<OperatingContext | null>).detail;
    handler(detail ?? null);
  };
  window.addEventListener(OPERATING_CONTEXT_EVENT, listener);
  return () => window.removeEventListener(OPERATING_CONTEXT_EVENT, listener);
};

export const readOperatingContext = (): OperatingContext => {
  if (typeof window === 'undefined') return null;
  const raw =
    localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OperatingContext;
  } catch {
    return null;
  }
};

export const writeOperatingContext = (ctx: OperatingContext) => {
  if (typeof window === 'undefined') return;
  const payload = ctx ? JSON.stringify(ctx) : '';
  [localStorage, sessionStorage].forEach((storage) => {
    if (!payload) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, payload);
  });
  dispatchOperatingContextChange(ctx);
};

export const ensureBusinessContext = (businessId?: string, businessName?: string): OperatingContext => {
  const cached = readOperatingContext();
  if (cached?.type === 'business' && cached.business_id) return cached;
  const userBiz = businessId ?? getCachedUser()?.businessId;
  if (!userBiz) return null;
  const ctx: OperatingContext = { type: 'business', business_id: String(userBiz), business_name: businessName };
  writeOperatingContext(ctx);
  return ctx;
};

export const withPlanTier = (ctx: OperatingContext, tier?: PlanTier): OperatingContext => {
  if (!ctx) return ctx;
  if (ctx.type === 'business') {
    return { ...ctx, planTier: tier ?? normalizeTier(ctx.planTier) };
  }
  return ctx;
};



