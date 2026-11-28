"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { CONSENT_CHOICE, type ConsentChoice } from "@/src/lib/constants";
import { saveConsentChoice } from "@/src/lib/consent";

export function CookieConsentBanner(): React.ReactElement | null {
  const t = useTranslations("common.cookie_consent");
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const choose = (choice: ConsentChoice): void => {
    saveConsentChoice(choice);
    setIsOpen(false);
  };

  return (
    <div
      role="region"
      aria-label={t("label")}
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-tray border border-border bg-popover/90 p-4 text-popover-foreground shadow-lg backdrop-blur-xl backdrop-saturate-150 sm:left-auto sm:right-6 sm:mx-0"
    >
      <p className="text-sm leading-relaxed">
        {t("text")}{" "}
        <Link href="/privacy#cookies" className="underline underline-offset-2">
          {t("link")}
        </Link>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="outline"
          size="compact"
          onClick={() => choose(CONSENT_CHOICE.DENIED)}
        >
          {t("reject")}
        </Button>
        <Button size="compact" onClick={() => choose(CONSENT_CHOICE.GRANTED)}>
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
