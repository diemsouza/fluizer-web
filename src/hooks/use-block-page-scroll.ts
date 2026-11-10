import { type RefObject, useEffect } from "react";

const SCROLL_EDGE_TOLERANCE_PX = 1;

function findScrollableAncestor(
  target: EventTarget | null,
  root: HTMLElement,
): HTMLElement | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && root.contains(node)) {
    if (node.scrollHeight > node.clientHeight) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") return node;
    }
    node = node.parentElement;
  }
  return null;
}

function isPushingPastEdge(element: HTMLElement, deltaY: number): boolean {
  const isAtTop = element.scrollTop <= SCROLL_EDGE_TOLERANCE_PX;
  const isAtBottom =
    element.scrollTop + element.clientHeight >=
    element.scrollHeight - SCROLL_EDGE_TOLERANCE_PX;
  return (deltaY > 0 && isAtTop) || (deltaY < 0 && isAtBottom);
}

// Gesto de toque que comeca no elemento nao rola a pagina. Quem tem rolagem
// propria (campo acima do limite de linhas, lista de comandos) rola por dentro
// e nao vaza para a pagina ao chegar no fim. O listener precisa ser nativo e
// nao passivo: o do React e passivo e nao aceita preventDefault.
export function useBlockPageScroll(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let lastY = 0;

    function handleTouchStart(event: TouchEvent): void {
      lastY = event.touches[0]?.clientY ?? 0;
    }

    function handleTouchMove(event: TouchEvent): void {
      if (!root || !event.cancelable) return;
      const currentY = event.touches[0]?.clientY ?? lastY;
      const deltaY = currentY - lastY;
      lastY = currentY;

      const scrollable = findScrollableAncestor(event.target, root);
      if (!scrollable || isPushingPastEdge(scrollable, deltaY)) {
        event.preventDefault();
      }
    }

    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    root.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("touchmove", handleTouchMove);
    };
  }, [ref]);
}
