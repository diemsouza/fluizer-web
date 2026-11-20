"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PhoneConfirmModal } from "@/src/components/shared/phone-confirm-modal";
import {
  AddToCalendarModal,
  type ReminderChannel,
} from "./add-to-calendar-modal";

type ReminderFlowContextValue = {
  openReminder: () => void;
};

const ReminderFlowContext = createContext<ReminderFlowContextValue | null>(
  null,
);

export function useReminderFlow(): ReminderFlowContextValue {
  const ctx = useContext(ReminderFlowContext);
  if (!ctx) throw new Error("useReminderFlow fora do ReminderFlowProvider");
  return ctx;
}

// WhatsApp é o canal preferido do lembrete: conta sem número sempre vê antes o
// cadastro do número. Confirmado, o lembrete abre já ativado no horário da
// conta; recusado, abre do mesmo jeito e o lembrete chega por e-mail.
export function ReminderFlowProvider({
  hasPhone,
  dailyReminderEnabled,
  dailyReminderTime,
  children,
}: {
  hasPhone: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("app.account");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [isPreset, setIsPreset] = useState(false);
  const [channel, setChannel] = useState<ReminderChannel>("whatsapp");

  const openReminder = useCallback(() => {
    if (hasPhone) {
      setIsPreset(false);
      setChannel("whatsapp");
      setReminderOpen(true);
      return;
    }
    setPhoneOpen(true);
  }, [hasPhone]);

  function handlePhoneConfirmed(): void {
    setPhoneOpen(false);
    setIsPreset(true);
    setChannel("whatsapp");
    setReminderOpen(true);
  }

  function handleEmailChosen(): void {
    setPhoneOpen(false);
    setIsPreset(false);
    setChannel("email");
    setReminderOpen(true);
  }

  const value = useMemo(() => ({ openReminder }), [openReminder]);

  return (
    <ReminderFlowContext.Provider value={value}>
      {children}
      <PhoneConfirmModal
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
        title={t("phone_prompt_title")}
        subtitle={t("phone_prompt_subtitle")}
        onConfirmed={handlePhoneConfirmed}
        secondaryAction={{
          label: t("phone_prompt_email_option"),
          onClick: handleEmailChosen,
        }}
      />
      <AddToCalendarModal
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        channel={channel}
        dailyReminderEnabled={isPreset || dailyReminderEnabled}
        dailyReminderTime={dailyReminderTime}
        isPreset={isPreset}
      />
    </ReminderFlowContext.Provider>
  );
}
