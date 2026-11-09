"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { usePracticePill } from "./practice-pill-provider";
import { QuestionRatingControls } from "./question-rating-controls";

export function PracticeActionsRow({
  onContinue,
  isLastMessageFeedback,
}: {
  onContinue: () => void;
  isLastMessageFeedback: boolean;
}) {
  const t = useTranslations("app.practice_actions");
  const tErrors = useTranslations("app.errors");
  const { hasContinueFailed, continuePractice } = usePracticePill();

  function handleContinue(): void {
    onContinue();
    void continuePractice();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Button size="compact" onClick={handleContinue}>
          {isLastMessageFeedback ? t("continue") : t("continue_practicing")}
        </Button>
        {isLastMessageFeedback && <QuestionRatingControls />}
      </div>
      {hasContinueFailed && (
        <p role="alert" className="px-1 text-sm text-muted-foreground">
          {tErrors("message_failed")}
        </p>
      )}
    </div>
  );
}
