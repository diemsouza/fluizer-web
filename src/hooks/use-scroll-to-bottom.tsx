import { useCallback, useEffect, useRef, useState } from "react";

const SETTLE_QUIET_MS = 150;
const SETTLE_MAX_WAIT_MS = 2500;
const SCROLL_UP_TOLERANCE_PX = 2;
const SCROLL_MIN_MS = 280;
const SCROLL_MAX_MS = 550;
const SCROLL_MS_PER_PX = 0.6;
// Folga entre o topo da lista e o topo da mensagem alinhada (padding do container).
const MESSAGE_TOP_GAP_PX = 16;

// nearBottomPx: distancia do fim em que a ultima mensagem ainda aparece
// inteira (espaco do digitando e do botao abaixo dela).
export function useScrollToBottom({ nearBottomPx }: { nearBottomPx: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const isAtBottomRef = useRef(true);
  // Depois de rolar ate o fim, crescimento do conteudo continua grudado no
  // fim ate chegar mensagem que nao rola ou o usuario rolar para cima.
  const isPinnedRef = useRef(true);
  const isUserScrolledUpRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const settleCallbackRef = useRef<(() => void) | null>(null);
  const settleQuietTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const settleMaxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const setPinned = useCallback((pinned: boolean) => {
    isPinnedRef.current = pinned;
    setIsPinned(pinned);
  }, []);

  const scrollContainerToBottom = useCallback((behavior: ScrollBehavior) => {
    const containerEl = containerRef.current;
    containerEl?.scrollTo({ top: containerEl.scrollHeight, behavior });
  }, []);

  const snapToBottom = useCallback(() => {
    scrollContainerToBottom("instant");
  }, [scrollContainerToBottom]);

  const isAnimating = useCallback(
    (): boolean => animationFrameRef.current !== null,
    [],
  );

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current === null) return;
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  // O scroll nativo suave e interrompido por qualquer snap do observer; esta
  // animacao segue o alvo a cada frame e o observer fica quieto enquanto roda.
  const animateScrollTo = useCallback(
    (getTarget: () => number, onDone?: () => void) => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      cancelAnimation();
      const startTop = containerEl.scrollTop;
      const startedAt = performance.now();
      const duration = Math.min(
        SCROLL_MAX_MS,
        Math.max(
          SCROLL_MIN_MS,
          Math.abs(getTarget() - startTop) * SCROLL_MS_PER_PX,
        ),
      );

      function step(now: number) {
        if (!containerEl) return;
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const target = getTarget();
        containerEl.scrollTop = startTop + (target - startTop) * eased;
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
          return;
        }
        animationFrameRef.current = null;
        onDone?.();
      }
      animationFrameRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation],
  );

  const getMaxScrollTop = useCallback((): number => {
    const containerEl = containerRef.current;
    if (!containerEl) return 0;
    return Math.max(0, containerEl.scrollHeight - containerEl.clientHeight);
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      setPinned(true);
      if (behavior === "smooth") {
        animateScrollTo(getMaxScrollTop);
        return;
      }
      cancelAnimation();
      scrollContainerToBottom(behavior);
    },
    [setPinned, animateScrollTo, getMaxScrollTop, cancelAnimation, scrollContainerToBottom],
  );

  // Mensagem curta termina no fim; mensagem maior que a area visivel para com o
  // topo dela perto do topo da lista, para ler de cima para baixo.
  const scrollToMessage = useCallback(
    (messageEl: HTMLElement) => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      function getTarget(): number {
        if (!containerEl) return 0;
        const messageTop =
          messageEl.getBoundingClientRect().top -
          containerEl.getBoundingClientRect().top +
          containerEl.scrollTop;
        return Math.min(getMaxScrollTop(), messageTop - MESSAGE_TOP_GAP_PX);
      }
      setPinned(true);
      animateScrollTo(getTarget, () => {
        if (getTarget() < getMaxScrollTop() - 1) setPinned(false);
      });
    },
    [animateScrollTo, getMaxScrollTop, setPinned],
  );

  const getDistanceFromBottom = useCallback((): number => {
    const containerEl = containerRef.current;
    if (!containerEl) return 0;
    return (
      containerEl.scrollHeight - containerEl.scrollTop - containerEl.clientHeight
    );
  }, []);

  const clearSettleTimers = useCallback(() => {
    if (settleQuietTimeoutRef.current) clearTimeout(settleQuietTimeoutRef.current);
    if (settleMaxTimeoutRef.current) clearTimeout(settleMaxTimeoutRef.current);
    settleQuietTimeoutRef.current = null;
    settleMaxTimeoutRef.current = null;
  }, []);

  const finishSettling = useCallback(() => {
    clearSettleTimers();
    const callback = settleCallbackRef.current;
    settleCallbackRef.current = null;
    snapToBottom();
    callback?.();
  }, [clearSettleTimers, snapToBottom]);

  const armQuietTimer = useCallback(() => {
    if (settleQuietTimeoutRef.current) clearTimeout(settleQuietTimeoutRef.current);
    settleQuietTimeoutRef.current = setTimeout(finishSettling, SETTLE_QUIET_MS);
  }, [finishSettling]);

  // Chamado por qualquer fonte de mudanca de layout durante o assentamento
  // inicial (resize do conteudo, altura do composer, viewport). Reacende o
  // timer de silencio e reposiciona; retorna true se ainda estava assentando
  // (o caller pode pular a propria logica de scroll nesse caso).
  const notifySettleActivity = useCallback((): boolean => {
    if (!settleCallbackRef.current) return false;
    snapToBottom();
    armQuietTimer();
    return true;
  }, [snapToBottom, armQuietTimer]);

  const scrollToBottomWhenSettled = useCallback(
    (onSettled: () => void) => {
      settleCallbackRef.current = onSettled;
      snapToBottom();
      clearSettleTimers();
      settleMaxTimeoutRef.current = setTimeout(finishSettling, SETTLE_MAX_WAIT_MS);

      const contentEl = contentRef.current;
      const pending: Promise<unknown>[] = [];
      if (typeof document !== "undefined" && "fonts" in document) {
        pending.push(document.fonts.ready);
      }
      contentEl?.querySelectorAll("img").forEach((img) => {
        if (!img.complete) {
          pending.push(
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
          );
        }
      });

      if (pending.length > 0) {
        // So comeca a contar o silencio depois que fontes/imagens ja
        // pendentes no momento do mount resolverem - senao o timer de 150ms
        // pode vencer entre duas imagens carregando em rede lenta e revelar
        // a conversa antes da ultima terminar. O ResizeObserver continua
        // cobrindo qualquer outra mudanca (imagem nova, audio, reflow).
        Promise.all(pending).then(() => {
          if (settleCallbackRef.current === onSettled) armQuietTimer();
        });
      } else {
        armQuietTimer();
      }
    },
    [snapToBottom, clearSettleTimers, finishSettling, armQuietTimer],
  );

  useEffect(() => {
    const containerEl = containerRef.current;
    const contentEl = contentRef.current;
    if (!containerEl || !contentEl) return;

    function measure() {
      const atBottom = getDistanceFromBottom() <= nearBottomPx;
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
      if (atBottom) isUserScrolledUpRef.current = false;
    }

    // Rolagem programatica so desce; subir longe do fim e gesto do usuario.
    function handleScroll() {
      if (!containerEl) return;
      const scrollTop = containerEl.scrollTop;
      const movedUp =
        scrollTop < lastScrollTopRef.current - SCROLL_UP_TOLERANCE_PX;
      lastScrollTopRef.current = scrollTop;
      measure();
      if (movedUp && !isAtBottomRef.current && !settleCallbackRef.current) {
        isUserScrolledUpRef.current = true;
        setPinned(false);
      }
    }

    function handleContentResize() {
      if (notifySettleActivity()) return;
      if (isAnimating()) {
        measure();
        return;
      }
      if (isPinnedRef.current) {
        snapToBottom();
        return;
      }
      measure();
    }

    measure();
    lastScrollTopRef.current = containerEl.scrollTop;
    containerEl.addEventListener("scroll", handleScroll, { passive: true });
    const userGestures = ["wheel", "touchstart", "keydown"] as const;
    userGestures.forEach((name) =>
      containerEl.addEventListener(name, cancelAnimation, { passive: true }),
    );
    const resizeObserver = new ResizeObserver(handleContentResize);
    resizeObserver.observe(contentEl);

    return () => {
      containerEl.removeEventListener("scroll", handleScroll);
      userGestures.forEach((name) =>
        containerEl.removeEventListener(name, cancelAnimation),
      );
      resizeObserver.disconnect();
    };
  }, [
    nearBottomPx,
    setPinned,
    snapToBottom,
    notifySettleActivity,
    getDistanceFromBottom,
    isAnimating,
    cancelAnimation,
  ]);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  useEffect(() => clearSettleTimers, [clearSettleTimers]);

  const isFollowing = useCallback(
    (): boolean =>
      !isUserScrolledUpRef.current &&
      (isPinnedRef.current || isAtBottomRef.current),
    [],
  );

  return {
    containerRef,
    contentRef,
    isAtBottom,
    isPinned,
    isUserScrolledUpRef,
    isFollowing,
    getDistanceFromBottom,
    isAnimating,
    scrollToBottom,
    scrollToMessage,
    snapToBottom,
    setPinned,
    scrollToBottomWhenSettled,
    notifySettleActivity,
  };
}
