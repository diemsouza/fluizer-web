// Sem CRON_SECRET a comparacao viraria "Bearer undefined", aceita por qualquer
// um que mande esse texto.
export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
