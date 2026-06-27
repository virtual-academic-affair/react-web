import type { ReactNode } from "react";

import { AppMobileLayoutShell } from "@/layouts/appMobileLayout";

type ChatbotMobileLayoutShellProps = {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  sidebar: ReactNode;
  children: ReactNode;
  preview: ReactNode;
  previewOpen: boolean;
};

/** Mobile: shared overlay drawer + full-width content. Desktop: inline flex row. */
export function ChatbotMobileLayoutShell({
  sidebarOpen,
  onCloseSidebar,
  sidebar,
  children,
  preview,
  previewOpen,
}: ChatbotMobileLayoutShellProps) {
  return (
    <AppMobileLayoutShell
      sidebarOpen={sidebarOpen}
      onCloseSidebar={onCloseSidebar}
      sidebar={sidebar}
      preview={preview}
      previewOpen={previewOpen}
      sidebarDesktop
    >
      {children}
    </AppMobileLayoutShell>
  );
}
