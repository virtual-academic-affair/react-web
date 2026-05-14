import type { SourceMessagePartProps } from "@assistant-ui/react";
import type { ReactNode } from "react";

export function Sources({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function Source({ url, title }: SourceMessagePartProps) {
  const label = title?.trim() || url;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}
