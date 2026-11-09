"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselApi } from "@/src/components/ui/carousel";

const DESKTOP_QUERY = "(hover: hover) and (min-width: 640px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const VISIBLE_THRESHOLD = 0.5;

interface UseCarouselAutoscrollParams {
  api: CarouselApi | undefined;
  intervalMs: number;
}

interface UseCarouselAutoscrollResult {
  sectionRef: React.RefObject<HTMLElement | null>;
  onUserHover: () => void;
}

export function useCarouselAutoscroll({
  api,
  intervalMs,
}: UseCarouselAutoscrollParams): UseCarouselAutoscrollResult {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: VISIBLE_THRESHOLD },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!api || !isVisible || isStopped) return;
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    const prefersReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    if (!isDesktop || prefersReduced) return;
    const id = window.setInterval(() => api.scrollNext(), intervalMs);
    return () => window.clearInterval(id);
  }, [api, isVisible, isStopped, intervalMs]);

  const onUserHover = useCallback(() => setIsStopped(true), []);

  return { sectionRef, onUserHover };
}
