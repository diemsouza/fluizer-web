import {
  CONSENT_CHOICE,
  CONSENT_COOKIE_MAX_AGE_DAYS,
  CONSENT_COOKIE_NAME,
  type ConsentChoice,
} from "./constants";

const CONSENT_SIGNALS = [
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "analytics_storage",
] as const;

function buildConsentState(choice: ConsentChoice): Record<string, ConsentChoice> {
  return Object.fromEntries(CONSENT_SIGNALS.map((signal) => [signal, choice]));
}

export function isConsentChoice(value: string | undefined): value is ConsentChoice {
  return value === CONSENT_CHOICE.GRANTED || value === CONSENT_CHOICE.DENIED;
}

// Consent Mode v2: o default precisa entrar no dataLayer antes do GTM carregar.
export function buildConsentInitScript(savedChoice: ConsentChoice | undefined): string {
  const defaultState = JSON.stringify(buildConsentState(CONSENT_CHOICE.DENIED));
  const update =
    savedChoice === CONSENT_CHOICE.GRANTED
      ? `gtag('consent','update',${JSON.stringify(buildConsentState(CONSENT_CHOICE.GRANTED))});`
      : "";
  return `window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};gtag('consent','default',${defaultState});${update}`;
}

export function saveConsentChoice(choice: ConsentChoice): void {
  const maxAge = CONSENT_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE_NAME}=${choice}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", buildConsentState(choice));
  }
}
