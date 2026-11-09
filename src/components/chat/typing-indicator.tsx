import type { ReactNode } from "react";

// h-9 = altura do botao Continuar: o slot fica sempre no fim da lista, com as
// acoes ou o digitando no mesmo lugar, e a altura do conteudo nao muda.
export const TYPING_SLOT_PX = 36;

export function TypingIndicatorSlot({
  isVisible,
  children,
}: {
  isVisible: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-9 shrink-0 flex-col justify-center"
      aria-hidden={!isVisible && !children}
    >
      {children ?? (isVisible && <TypingIndicatorBubble />)}
    </div>
  );
}

function TypingIndicatorBubble() {
  return (
    <div className="relative z-10 flex justify-start">
      <div className="flex items-center gap-1 rounded-[10px_10px_10px_2px] bg-white px-3.5 py-3 dark:bg-[#252529]">
        <span className="h-1 w-1 animate-typing-dot rounded-full bg-muted-foreground/60 [animation-delay:0s]" />
        <span className="h-1 w-1 animate-typing-dot rounded-full bg-muted-foreground/60 [animation-delay:0.15s]" />
        <span className="h-1 w-1 animate-typing-dot rounded-full bg-muted-foreground/60 [animation-delay:0.3s]" />
      </div>
    </div>
  );
}
