import { useEffect, useRef } from "react";
import { useListMessages, Message } from "@workspace/api-client-react";
import { MessageBubble } from "./MessageBubble";
import { useAuth } from "@/context/AuthContext";

interface MessageListProps {
  conversationId: number;
  onReply: (msg: any) => void;
}

export function MessageList({ conversationId, onReply }: MessageListProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], isLoading } = useListMessages(
    conversationId,
    {},
    { query: { enabled: !!conversationId } as any }
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center p-4">Loading messages...</div>;
  }

  // Sort messages chronologically
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Group messages by date
  let lastDate = "";

  return (
    <div 
      className="flex-1 overflow-y-auto px-[5%] py-4 scroll-smooth h-full"
      ref={scrollRef}
    >
      <div className="flex flex-col justify-end min-h-full">
        <div className="bg-yellow-100 dark:bg-[#182229] dark:text-[#ffd279] text-yellow-800 text-xs px-3 py-2 rounded-lg mb-6 self-center shadow-sm text-center max-w-[90%]">
          Messages and calls are end-to-end encrypted. No one outside of this chat, not even ChatMe, can read or listen to them.
        </div>
        
        {sortedMessages.map((msg, index) => {
          const messageDate = new Date(msg.createdAt).toLocaleDateString();
          const showDateHeader = messageDate !== lastDate;
          lastDate = messageDate;

          const isMine = msg.senderId === user?.id;
          const showTail = index === sortedMessages.length - 1 || sortedMessages[index + 1].senderId !== msg.senderId;
          
          return (
            <div key={msg.id} className="flex flex-col">
              {showDateHeader && (
                <div className="my-4 self-center bg-gray-200 dark:bg-[#182229] dark:text-gray-300 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg shadow-sm uppercase tracking-wider">
                  {messageDate === new Date().toLocaleDateString() ? "TODAY" : messageDate}
                </div>
              )}
              
              <MessageBubble 
                message={msg} 
                isMine={isMine} 
                showTail={showTail}
                onReply={() => onReply(msg)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
