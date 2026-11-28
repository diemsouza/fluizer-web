import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LAST_ACCESS_COOKIE_NAME } from "@/src/core/last-access";
import { buildSourceData, parseAttributionCookie } from "@/src/core/attribution";
import { ATTRIBUTION_COOKIE_NAME, SITE_URL } from "@/src/lib/constants";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/login` },
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const hasAccessedBefore = Boolean(
    cookieStore.get(LAST_ACCESS_COOKIE_NAME)?.value,
  );
  const attribution = parseAttributionCookie(
    cookieStore.get(ATTRIBUTION_COOKIE_NAME)?.value,
  );
  return (
    <LoginFlow
      hasAccessedBefore={hasAccessedBefore}
      campaignParams={attribution ? buildSourceData(attribution) : {}}
    />
  );
}
