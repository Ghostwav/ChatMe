import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getListConversationsQueryKey, getListMessagesQueryKey, Message, getGetConversationQueryKey } from "@workspace/api-client-react";

let socketInstance: Socket | null = null;

export const getSocket = () => {
  if (!socketInstance) {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    socketInstance = io(apiUrl, { path: "/api/socket.io", withCredentials: true });
  }
  return socketInstance;
};

export function useSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("new_message", (message: Message) => {
      queryClient.setQueryData(getListMessagesQueryKey(message.conversationId), (oldData: Message[] | undefined) => {
        if (!oldData) return [message];
        return [message, ...oldData.filter(m => m.id !== message.id)];
      });
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    });

    socket.on("message_deleted", ({ messageId, conversationId }: { messageId: number, conversationId: number }) => {
      queryClient.setQueryData(getListMessagesQueryKey(conversationId), (oldData: Message[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(m => m.id === messageId ? { ...m, isDeleted: true } : m);
      });
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    });

    socket.on("message_reaction", ({ messageId, conversationId, reaction }: { messageId: number, conversationId: number, reaction: any }) => {
      queryClient.setQueryData(getListMessagesQueryKey(conversationId), (oldData: Message[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(m => {
          if (m.id === messageId) {
            const existingReactions = m.reactions || [];
            return { ...m, reactions: [...existingReactions.filter((r: any) => r.userId !== reaction.userId), reaction] };
          }
          return m;
        });
      });
    });

    return () => {
      socket.off("new_message");
      socket.off("message_deleted");
      socket.off("message_reaction");
    };
  }, [queryClient]);

  const joinConversation = (conversationId: number) => {
    socketRef.current?.emit("join_conversation", conversationId);
  };
  const startTyping = (conversationId: number) => {
    socketRef.current?.emit("typing_start", { conversationId });
  };
  const stopTyping = (conversationId: number) => {
    socketRef.current?.emit("typing_stop", { conversationId });
  };
  const markRead = (conversationId: number) => {
    socketRef.current?.emit("mark_read", { conversationId });
  };

  return { socket: socketRef.current, joinConversation, startTyping, stopTyping, markRead };
}
