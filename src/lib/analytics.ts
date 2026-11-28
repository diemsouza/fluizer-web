import type { DomainId, SubscriptionInterval } from "./constants";

export type AuthMethod = "phone" | "whatsapp" | "google";
export type CheckoutPlan = "monthly" | "annual";
export type CtaPosition =
  | "hero"
  | "simulator"
  | "simulator_reply"
  | "features"
  | "pricing"
  | "faq"
  | "floating";
export type ActivitySource = "text" | "material";
export type ReminderChannel = "whatsapp" | "email";

export const CHECKOUT_PLAN_BY_INTERVAL: Record<
  SubscriptionInterval,
  CheckoutPlan
> = {
  monthly: "monthly",
  yearly: "annual",
};

type PurchaseItem = {
  item_id: CheckoutPlan;
  item_name: string;
  price: number;
  quantity: number;
};

export type AnalyticsEventMap = {
  sign_up: { method: AuthMethod };
  login: { method: AuthMethod };
  begin_checkout: { plan: CheckoutPlan; value: number; currency: "BRL" };
  purchase: {
    transaction_id: string;
    value: number;
    currency: "BRL";
    items: PurchaseItem[];
  };
  cta_click: { position: CtaPosition; domain?: DomainId };
  simulator_tab: { domain: DomainId };
  activity_created: { source: ActivitySource; domain?: DomainId };
  // Primeira resposta avaliada de cada atividade (guia pos-primeiro-feedback).
  activity_first_answer: Record<string, never>;
  paywall_view: { reason: "plan_expired" };
  view_plans: Record<string, never>;
  phone_confirmed: Record<string, never>;
  reminder_enabled: { channel: ReminderChannel };
  blog_cta_click: { slug: string; variant: string };
};

function pushToDataLayer(entry: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(entry);
}

export const track = <E extends keyof AnalyticsEventMap>(
  event: E,
  params: AnalyticsEventMap[E],
): void => {
  pushToDataLayer({ event, ...params });
};

export const setUserId = (userId: string): void => {
  pushToDataLayer({ user_id: userId });
};
