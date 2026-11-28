import { getTranslations } from "next-intl/server";
import HomePage from "@/src/components/home/page";
import type { Metadata } from "next";
import { buildHomeJsonLd } from "@/src/lib/structured-data";
import { SITE_URL } from "@/src/lib/constants";

// Canonical so na home: no root layout ele vazava para as paginas sem canonical proprio.
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default async function Home() {
  const [tFaq, tSeo] = await Promise.all([
    getTranslations("home.faq"),
    getTranslations("common.seo"),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildHomeJsonLd(tFaq, tSeo("description"))),
        }}
      />
      <HomePage />
    </>
  );
}
