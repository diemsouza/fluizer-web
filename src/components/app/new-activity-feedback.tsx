"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PLANS_PATH } from "@/src/lib/constants";
import { track } from "@/src/lib/analytics";
import type { NewActivityFeedback } from "./new-activity-outcome";

export function NewActivityFeedbackView({
  feedback,
  onExampleClick,
}: {
  feedback: NewActivityFeedback;
  onExampleClick?: (example: string) => void;
}) {
  const t = useTranslations("app.new_activity");
  const isPlanExpired =
    feedback.kind === "error" && feedback.messageKey === "plan_expired";

  useEffect(() => {
    if (isPlanExpired) track("paywall_view", { reason: "plan_expired" });
  }, [isPlanExpired]);

  if (feedback.kind === "error") {
    return (
      <p role="alert" className="mt-2 text-sm text-destructive">
        {t(`errors.${feedback.messageKey}`)}{" "}
        {isPlanExpired && (
          <Link href={PLANS_PATH} className="font-medium underline">
            {t("plans_link")}
          </Link>
        )}
      </p>
    );
  }

  return (
    <div role="status" className="mt-2 space-y-2">
      <p className="text-sm text-muted-foreground">
        {feedback.hint ?? t("needs_more_default")}
      </p>
      {feedback.examples.length > 0 && onExampleClick && (
        <div className="flex flex-wrap gap-2">
          {feedback.examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onExampleClick(example)}
              className="rounded-full border border-primary/40 px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
            >
              + {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
