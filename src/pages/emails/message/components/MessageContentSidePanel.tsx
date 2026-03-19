import React from "react";

interface MessageContentSidePanelProps {
  content: string;
}

const MessageContentSidePanel: React.FC<MessageContentSidePanelProps> = ({
  content,
}) => {
  return (
    <div className="flex flex-col">
      <div className="border-gray-100dark:border-white/5 mb-4 flex items-center justify-between">
        <h3 className="text-navy-700 text-lg font-bold dark:text-white">
          Nội dung tin nhắn
        </h3>
      </div>
      <div className="flex-1">
        <div
          className="prose prose-sm dark:prose-invert max-w-none leading-relaxed wrap-break-word whitespace-pre-wrap text-gray-700 select-text dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

export default MessageContentSidePanel;
