import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/lib/constants";

// "/app" sem barra casaria por prefixo com /apple-touch-icon.png.
const DISALLOWED_PATHS = ["/app/", "/app$", "/api/", "/login", "/r/", "/payment"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
