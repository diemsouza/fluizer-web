"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { WaitlistModal } from "@/src/components/home/waitlist-modal";
import { useHomeDomain } from "@/src/components/home/home-domain-provider";
import { buildAppEntryUrl } from "@/src/core/domain-param";
import { track, type CtaPosition } from "@/src/lib/analytics";
const IS_WAITLIST = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";

type HomeCTAProps = {
  waLabel: string;
  position: CtaPosition;
  buttonClassName?: string;
  icon?: ReactNode;
  isCtaAnchor?: boolean;
};

export function HomeCTA({
  waLabel,
  buttonClassName,
  icon,
  position,
  isCtaAnchor,
}: HomeCTAProps) {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);
  const homeDomain = useHomeDomain();
  const selectedDomain = homeDomain?.selectedDomain ?? null;
  const trackClick = (): void => {
    track("cta_click", { position, ...(selectedDomain && { domain: selectedDomain }) });
  };

  if (IS_WAITLIST) {
    return (
      <>
        <Button
          size="lg"
          className={buttonClassName}
          onClick={() => {
            trackClick();
            setOpen(true);
          }}
          data-cta-anchor={isCtaAnchor || undefined}
        >
          {t("waitlist.cta")}
        </Button>
        <WaitlistModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <a
      href={buildAppEntryUrl(selectedDomain)}
      onClick={trackClick}
      data-cta-anchor={isCtaAnchor || undefined}
    >
      <Button size="lg" className={buttonClassName}>
        {waLabel}
        {icon ?? <ArrowRight className="w-5 h-5" strokeWidth={2.5} />}
      </Button>
    </a>
  );
}
