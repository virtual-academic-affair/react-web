import React from "react";

import { ChatbotRuntimeProvider } from "./ChatbotRuntimeProvider";
import { GeminiThread } from "./components/GeminiThread";
import { CHAT_LAYOUT_CLASSNAME } from "./constants";

const ChatbotPage: React.FC = () => {
  return (
    <div className={CHAT_LAYOUT_CLASSNAME}>
      <ChatbotRuntimeProvider>
        <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
          <div className="min-h-0 flex-1">
            <GeminiThread />
          </div>
        </div>
      </ChatbotRuntimeProvider>
    </div>
  );
};

export default ChatbotPage;
