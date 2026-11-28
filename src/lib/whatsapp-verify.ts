import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhookToken(
  searchParams: URLSearchParams,
): string | null {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

export async function verifyMetaSignature(
  req: Request,
): Promise<{ valid: boolean; rawBody: string }> {
  const signature = req.headers.get("x-hub-signature-256");
  const rawBody = await req.text();

  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!signature || !secret) return { valid: false, rawBody };

  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  return { valid: isSameSignature(signature, expected), rawBody };
}

// Tempo constante: comparar com === vaza pelo tempo quantos caracteres batem.
function isSameSignature(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
