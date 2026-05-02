import React from "react";

const TypingIndicator: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 dark:bg-white/10">
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s] dark:bg-gray-300" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s] dark:bg-gray-300" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 dark:bg-gray-300" />
    </div>
  );
};

export default TypingIndicator;

