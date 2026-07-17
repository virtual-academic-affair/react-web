import { useEffect, useRef, type Ref } from "react";
import {
  CircleCheckBigIcon,
  FolderOpenIcon,
  ScanLineIcon,
  type CircleCheckBigIconHandle,
  type FolderOpenIconHandle,
  type ScanLineIconHandle,
} from "@animateicons/react/lucide";
import { MdFolder, MdFolderOpen, MdLock } from "react-icons/md";

import type { CorpusTraversalAction } from "../types";

type IconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

const ACTION_LOOP_MS: Record<CorpusTraversalAction, number> = {
  expand: 2600,
  inspect: 2000,
  select: 1700,
  no_match: 2200,
};

const ACTION_ICON_DURATION = 1.45;

const ACTION_COLORS: Record<CorpusTraversalAction, string> = {
  expand: "#0284c7",
  inspect: "#7c3aed",
  select: "#059669",
  no_match: "#e11d48",
};

function useLoopAnimation(active: boolean, loopMs: number) {
  const ref = useRef<IconHandle | null>(null);

  useEffect(() => {
    const handle = ref.current;
    if (!handle) return;

    if (!active) {
      handle.stopAnimation();
      return;
    }

    handle.startAnimation();
    const timer = window.setInterval(() => {
      ref.current?.startAnimation();
    }, loopMs);

    return () => {
      window.clearInterval(timer);
      ref.current?.stopAnimation();
    };
  }, [active, loopMs]);

  return ref;
}

export function CorpusActionIcon({
  action,
  active,
  size = 16,
  className,
  color,
}: {
  action: CorpusTraversalAction;
  active: boolean;
  size?: number;
  className?: string;
  color?: string;
}) {
  const loopMs = ACTION_LOOP_MS[action];
  const resolvedColor = color ?? (active ? ACTION_COLORS[action] : "currentColor");
  const ref = useLoopAnimation(active && action !== "no_match", loopMs);

  if (action === "expand") {
    return (
      <FolderOpenIcon
        ref={ref as Ref<FolderOpenIconHandle>}
        size={size}
        className={className}
        color={resolvedColor}
        duration={ACTION_ICON_DURATION}
        isAnimated
      />
    );
  }

  if (action === "inspect") {
    return (
      <ScanLineIcon
        ref={ref as Ref<ScanLineIconHandle>}
        size={size}
        className={className}
        color={resolvedColor}
        duration={ACTION_ICON_DURATION}
        isAnimated
      />
    );
  }

  if (action === "select") {
    return (
      <CircleCheckBigIcon
        ref={ref as Ref<CircleCheckBigIconHandle>}
        size={size}
        className={className}
        color={resolvedColor}
        duration={ACTION_ICON_DURATION}
        isAnimated
      />
    );
  }

  return (
    <MdLock
      className={className}
      style={{ width: size, height: size, color: resolvedColor }}
      aria-hidden
    />
  );
}

export function CorpusStaticFolderIcon({
  open,
  className,
}: {
  open: boolean;
  size?: number;
  className?: string;
  color?: string;
}) {
  if (open) {
    return (
      <MdFolderOpen
        className={`text-brand-500 h-4 w-4 shrink-0 dark:text-[#a8c7fa] ${className ?? ""}`}
        aria-hidden
      />
    );
  }

  return (
    <MdFolder
      className={`h-4 w-4 shrink-0 text-amber-500 ${className ?? ""}`}
      aria-hidden
    />
  );
}
