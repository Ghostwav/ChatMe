import { useEffect, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { useGetConversation, useMarkConversationRead } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/useSocket";
import { MessagePreview } from "@workspace/api-client-react";

interface ChatPanelProps {
  conversationId: number;
}

export function ChatPanel({ conversationId }: ChatPanelProps) {
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
    <div className="flex-1 flex flex-col h-full bg-chat-bg relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none mix-blend-multiply dark:mix-blend-screen bg-repeat z-0" 
           style={{ backgroundImage: 'url("https://i.ibb.co/3vkbQ1r/whatsapp-bg.png")' }}>
      </div>

      <div className="relative z-10 flex-none">
        <ChatHeader conversation={conversation} />
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
