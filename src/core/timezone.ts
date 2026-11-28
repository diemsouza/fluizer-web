// So nome IANA ("America/Sao_Paulo", "UTC"). Offset como "+03:00" fica de
// fora: o Intl aceita, mas o Postgres le com o sinal invertido no AT TIME ZONE.
const IANA_NAME_PATTERN = /^(?:UTC|[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+)$/;

export function isValidTimeZone(value: string): boolean {
  if (!IANA_NAME_PATTERN.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
