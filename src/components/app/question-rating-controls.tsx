"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { usePracticePill } from "./practice-pill-provider";
import { QuestionRatingModal } from "./question-rating-modal";

const RATING_BUTTON_CLASS = "h-8 w-8 text-muted-foreground";
const RATED_CLASS = "disabled:opacity-100";

export function QuestionRatingControls() {
  const t = useTranslations("app.practice_actions");
  const { practiceActions, markRated } = usePracticePill();
  const [modalRating, setModalRating] = useState<boolean | null>(null);

  if (!practiceActions) return null;
  const { questionId, rating } = practiceActions;
  const isRated = rating !== null;

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          disabled={isRated}
          aria-label={t("like_aria")}
          aria-pressed={rating === true}
          onClick={() => setModalRating(true)}
          className={cn(RATING_BUTTON_CLASS, rating === true && RATED_CLASS)}
        >
          <ThumbsUp
            className={cn("h-4 w-4", rating === true && "fill-current")}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isRated}
          aria-label={t("dislike_aria")}
          aria-pressed={rating === false}
          onClick={() => setModalRating(false)}
          className={cn(RATING_BUTTON_CLASS, rating === false && RATED_CLASS)}
        >
          <ThumbsDown
            className={cn("h-4 w-4", rating === false && "fill-current")}
          />
        </Button>
      </div>
      <QuestionRatingModal
        questionId={questionId}
        rating={modalRating}
        onClose={() => setModalRating(null)}
        onRated={markRated}
      />
    </>
  );
}
