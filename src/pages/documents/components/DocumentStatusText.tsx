import { useEffect, useState } from "react";

import {
  DOCUMENT_STATUS_TEXT_COLOR,
} from "./documentStatus";

type DocumentStatusTextProps = {
  label: string;
  animate?: boolean;
};

/** Status label with optional cycling dots: . → .. → ... → . */
export default function DocumentStatusText({
  label,
  animate = false,
}: DocumentStatusTextProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!animate) {
      setDotCount(1);
      return;
    }
    const id = window.setInterval(() => {
      setDotCount((count) => (count >= 3 ? 1 : count + 1));
    }, 450);
    return () => window.clearInterval(id);
  }, [animate]);

  return (
    <span
      className="text-[11px] font-semibold"
      style={{ color: DOCUMENT_STATUS_TEXT_COLOR }}
    >
      {label}
      {animate ? (
        <span
          className="ml-0.5 inline-block w-[1.6em] tracking-[0.12em] text-left"
          aria-hidden
        >
          {".".repeat(dotCount)}
        </span>
      ) : null}
    </span>
  );
}
