import { useEffect, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { useGetConversation, useMarkConversationRead } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/useSocket";
import { MessagePreview } from "@workspace/api-client-react";

interface ChatPanelProps {
  conversationId: number;
  onBack?: () => void;
}

export function ChatPanel({ conversationId, onBack }: ChatPanelProps) {
  const { data: conversation, isLoading } = useGetConversation(conversationId, {
    query: { enabled: !!conversationId } as any
  });

  const markRead = useMarkConversationRead();
  const { joinConversation } = useSocket();
  const [replyTo, setReplyTo] = useState<MessagePreview | null>(null);

  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      markRead.mutate({ conversationId });
      setReplyTo(null);
    }
  }, [conversationId, joinConversation]);

  if (isLoading || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="w-8 h-8 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-chat-bg relative">
      {/* WhatsApp-style subtle pattern background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: "var(--chat-bg, #efeae2)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300000008' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      <div className="relative z-10 flex-none">
        <ChatHeader conversation={conversation} onBack={onBack} />
      </div>

      <div className="relative z-10 flex-1 overflow-hidden">
        <MessageList
          conversationId={conversationId}
          onReply={(msg) => setReplyTo(msg)}
        />
      </div>

      <div className="relative z-10 flex-none">
        <MessageComposer
          conversationId={conversationId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
