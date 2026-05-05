import type { FC } from "react";

interface GmailAccessBlockedProps {
  title: string;
  message: string;
}

const GmailAccessBlocked: FC<GmailAccessBlockedProps> = ({ title, message }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <img
        src="https://www.gstatic.com/tasks/empty-tasks-light.svg"
        alt=""
        className="mb-4 w-72"
      />
      <p className="mb-2 text-center text-base font-semibold text-gray-500 uppercase">
        {title}
      </p>
      <p className="mb-4 text-center text-sm text-gray-500">{message}</p>
      <button
        type="button"
        onClick={() =>
          window.open("https://vaa.hcmus.app", "_blank", "noopener,noreferrer")
        }
        className="bg-brand-500 hover:bg-brand-600 rounded-full px-5 py-3 text-xs font-semibold text-white"
      >
        Quản lý Giáo vụ số
      </button>
    </div>
  );
};

export default GmailAccessBlocked;

