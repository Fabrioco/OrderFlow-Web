
export const PLAN_FEATURES = {
  free: {
    pdv: false,
    ia: false,
    relatorios: false,
    multiUnidade: false,
  },
  essencial: {
    pdv: true,
    ia: false,
    relatorios: false,
    multiUnidade: false,
  },
  basico: {
    pdv: true,
    ia: true,
    relatorios: true,
    multiUnidade: false,
  },
  pro: {
    pdv: true,
    ia: true,
    relatorios: true,
    multiUnidade: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_FEATURES;
export type FeatureType = keyof typeof PLAN_FEATURES.free;

// ✅ Tipado corretamente
export const PLAN_PRICES: Record<Exclude<PlanType, "free">, number> = {
  essencial: 19.9,
  basico: 39.9,
  pro: 79.9,
};

// ✅ Labels tipados
export const PLAN_LABELS: Record<PlanType, string> = {
  free: "Free",
  essencial: "Essencial",
  basico: "Básico",
  pro: "Pro",
};

// ✅ Função segura
export function canAccess(plan: PlanType, feature: FeatureType) {
  return PLAN_FEATURES[plan][feature];
}
