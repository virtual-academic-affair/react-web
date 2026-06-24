import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

type ScrollFadeOptions = {
  topFadeRem?: number;
  bottomFadeRem?: number;
  thresholdPx?: number;
};

const DEFAULT_OPTIONS: Required<ScrollFadeOptions> = {
  topFadeRem: 2,
  bottomFadeRem: 2.5,
  thresholdPx: 6,
};

function buildScrollFadeMaskStyle(
  fadeTop: boolean,
  fadeBottom: boolean,
  options: Required<ScrollFadeOptions>,
): CSSProperties {
  const topStop = fadeTop
    ? `transparent 0%, black ${options.topFadeRem}rem`
    : "black 0%";
  const bottomStop = fadeBottom
    ? `black calc(100% - ${options.bottomFadeRem}rem), transparent 100%`
    : "black 100%";
  const gradient = `linear-gradient(to bottom, ${topStop}, ${bottomStop})`;

  return {
    maskImage: gradient,
    WebkitMaskImage: gradient,
  };
}

export function useScrollFadeState<T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: unknown[] = [],
  options?: ScrollFadeOptions,
) {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const updateFades = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const canScroll = scrollHeight > clientHeight + 1;

    setFadeTop(canScroll && scrollTop > resolvedOptions.thresholdPx);
    setFadeBottom(
      canScroll &&
        scrollTop + clientHeight < scrollHeight - resolvedOptions.thresholdPx,
    );
  }, [ref, resolvedOptions.thresholdPx]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    updateFades();
    element.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);

    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(element);
    for (const child of element.children) {
      resizeObserver.observe(child);
    }

    const frameId = window.requestAnimationFrame(updateFades);
    const delayedId = window.setTimeout(updateFades, 50);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(delayedId);
      element.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
      resizeObserver.disconnect();
    };
  }, [ref, updateFades, ...deps]);

  return { fadeTop, fadeBottom };
}

export function useScrollFadeMask<T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: unknown[] = [],
  options?: ScrollFadeOptions,
) {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { fadeTop, fadeBottom } = useScrollFadeState(ref, deps, options);

  return useMemo(
    () => buildScrollFadeMaskStyle(fadeTop, fadeBottom, resolvedOptions),
    [fadeBottom, fadeTop, resolvedOptions],
  );
}

type ScrollFadeAreaProps = {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
  watchDeps?: unknown[];
} & ScrollFadeOptions;

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  };
}

export const ScrollFadeArea = forwardRef<HTMLDivElement, ScrollFadeAreaProps>(
  function ScrollFadeArea(
    {
      children,
      className,
      wrapperClassName,
      style,
      thresholdPx,
      topFadeRem,
      bottomFadeRem,
      watchDeps = [],
    },
    forwardedRef,
  ) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const maskStyle = useScrollFadeMask(
      scrollRef,
      [children, ...watchDeps],
      { thresholdPx, topFadeRem, bottomFadeRem },
    );

    return (
      <div className={`relative min-h-0 ${wrapperClassName ?? ""}`.trim()}>
        <div
          ref={mergeRefs(scrollRef, forwardedRef)}
          className={className}
          style={{ ...style, ...maskStyle }}
        >
          {children}
        </div>
      </div>
    );
  },
);
