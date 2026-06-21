import { useEffect } from "react";

type ScrollLockSnapshot = {
  scrollX: number;
  scrollY: number;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyWidth: string;
  htmlOverflow: string;
};

let activeLocks = 0;
let snapshot: ScrollLockSnapshot | null = null;

function lockBodyScroll() {
  if (activeLocks === 0) {
    const { body, documentElement } = document;

    snapshot = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyWidth: body.style.width,
      htmlOverflow: documentElement.style.overflow,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${snapshot.scrollY}px`;
    body.style.left = `-${snapshot.scrollX}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";
  }

  activeLocks += 1;
}

function unlockBodyScroll() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks > 0 || !snapshot) return;

  const { body, documentElement } = document;
  const previous = snapshot;
  snapshot = null;

  body.style.overflow = previous.bodyOverflow;
  body.style.position = previous.bodyPosition;
  body.style.top = previous.bodyTop;
  body.style.left = previous.bodyLeft;
  body.style.width = previous.bodyWidth;
  documentElement.style.overflow = previous.htmlOverflow;
  window.scrollTo(previous.scrollX, previous.scrollY);
}

type BodyScrollLockOptions = {
  maxViewportWidth?: number;
};

export function useBodyScrollLock(
  locked: boolean,
  { maxViewportWidth }: BodyScrollLockOptions = {},
) {
  useEffect(() => {
    if (
      !locked ||
      (maxViewportWidth !== undefined &&
        window.innerWidth >= maxViewportWidth)
    ) {
      return;
    }

    lockBodyScroll();
    return unlockBodyScroll;
  }, [locked, maxViewportWidth]);
}
