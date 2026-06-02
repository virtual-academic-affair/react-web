import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { PropsWithChildren } from "react";

import { ChatbotShellProvider } from "./chatbotShellContext";
import { useChatbotRuntime } from "./useChatbotRuntime";

function ChatbotRuntimeProviderInner({ children }: PropsWithChildren) {
  const { runtimeOptions, shellValue } = useChatbotRuntime();

  // Thread list management is handled entirely by our own React state.
  // We deliberately do NOT pass adapters.threadList to useExternalStoreRuntime
  // to avoid the assistant-ui bug where tapClientLookup calls getItemById() for
  // a thread that was just removed, throwing "Entry not available in the store"
  // inside a useEffect, which React Error Boundaries cannot catch.
  const runtime = useExternalStoreRuntime(runtimeOptions);

  return (
    <ChatbotShellProvider value={shellValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatbotShellProvider>
  );
}

export function ChatbotRuntimeProvider({ children }: PropsWithChildren) {
  return <ChatbotRuntimeProviderInner>{children}</ChatbotRuntimeProviderInner>;
}
