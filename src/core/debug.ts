export const DEBUG_COOKIE_NAME = "fz_debug";
export const DEBUG_COOKIE_MAX_AGE_DAYS = 365;

export type DebugParamAction = "on" | "off";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function parseDebugParam(
  value: string | null | undefined,
): DebugParamAction | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return "on";
  if (normalized === "0" || normalized === "false") return "off";
  return null;
}

export function isDebug(cookies: CookieReader): boolean {
  return cookies.get(DEBUG_COOKIE_NAME)?.value === "1";
}
