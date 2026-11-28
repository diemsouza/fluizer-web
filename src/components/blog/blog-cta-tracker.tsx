"use client";

import { useEffect } from "react";
import { track } from "@/src/lib/analytics";
import { BLOG_CTA_ATTR } from "@/src/core/blog";

// Um listener so no layout: o BlogCta continua server component, sem JS.
export function BlogCtaTracker(): null {
  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest(`[${BLOG_CTA_ATTR}]`);
      if (!link) return;
      const slug = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
      track("blog_cta_click", { slug, variant: link.getAttribute(BLOG_CTA_ATTR) ?? "" });
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
