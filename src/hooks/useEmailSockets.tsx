import { API_CONFIG } from "@/config/api.config";
import { useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export const useEmailSockets = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(API_CONFIG.baseURL);

    socket.on("connect", () => {});

    socket.on("email.ingested", (data: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["processingMessageIds"] });

      notification.info({
        message: `${data.count} tin nhắn mới`,
        description: (
          <>
            <button
              onClick={() => {
                navigate("/admin/email/messages");
                notification.destroy("email-ingested");
              }}
              className="bg-brand-500 w-fit rounded-xl px-4 py-2 font-bold text-white transition-opacity hover:opacity-80"
            >
              DS tin nhắn
            </button>
          </>
        ),
        placement: "bottomRight",
        duration: 0,
        key: "email-ingested",
      });
    });

    socket.on("message.labels.updated", (data?: { messageId?: number }) => {
      console.log("📥 [SOCKET] Nhận được message.labels.updated:", data);

      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["processingMessageIds"] });

      if (data?.messageId) {
        queryClient.invalidateQueries({
          queryKey: ["message", data.messageId],
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate, queryClient]);
};
