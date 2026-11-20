import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

import type { UserIdentity } from "../types/domain";

export const WA_LOGIN_TOKEN_MAX_AGE_SEC = 24 * 60 * 60;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

// Conta sem número (login pelo Google) recebe o lembrete por e-mail com o
// mesmo link de login automático, identificada pelo e-mail.
export async function signWaLoginToken(
  identity: UserIdentity,
): Promise<string> {
  return new SignJWT(identity)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${WA_LOGIN_TOKEN_MAX_AGE_SEC}s`)
    .sign(getSecretKey());
}

export async function verifyWaLoginToken(
  token: string,
): Promise<UserIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.phone === "string") return { phone: payload.phone };
    if (typeof payload.email === "string") return { email: payload.email };
    return null;
  } catch (err) {
    // jwtVerify lança pra assinatura inválida, token expirado ou malformado —
    // todos tratados igualmente como "sem login automático", nunca propagados.
    console.error(
      "[verifyWaLoginToken] verify failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
