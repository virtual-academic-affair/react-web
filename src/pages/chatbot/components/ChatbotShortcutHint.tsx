import { useEffect, useState } from "react";

function getModKeyLabel() {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘" : "Ctrl";
}

export function useChatbotModKeyLabel() {
  const [modKeyLabel, setModKeyLabel] = useState(getModKeyLabel);

  useEffect(() => {
    setModKeyLabel(getModKeyLabel());
  }, []);

  return modKeyLabel;
}

export function ChatbotShortcutHint({ keys }: { keys: string[] }) {
  return (
    <span
      className="ml-auto shrink-0 pl-2 font-normal tracking-wide opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      aria-hidden
    >
      {keys.join(" ")}
    </span>
  );
}
