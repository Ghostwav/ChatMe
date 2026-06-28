import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@workspace/api-client-react";
import { getInitials, getAvatarColor, formatLastSeen } from "@/lib/utils";
import { ArrowLeft, Search, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { TypingIndicator } from "./TypingIndicator";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const isDirect = conversation.type === "direct";
  const otherMember = isDirect
    ? conversation.members.find(m => m.userId !== user?.id)?.user
    : null;
  const displayName = isDirect
    ? (otherMember?.displayName || otherMember?.username || "Unknown")
    : (conversation.name || "Group");
  const avatarUrl = isDirect ? otherMember?.avatarUrl : conversation.avatarUrl;

  useEffect(() => {
    if (!socket) return;
    const handleTyping = ({ conversationId, userId, isTyping }: any) => {
      if (conversationId === conversation.id && userId !== user?.id) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (isTyping) next.add(userId); else next.delete(userId);
          return next;
        });
      }
    };
    socket.on("typing", handleTyping);
    return () => { socket.off("typing", handleTyping); };
  }, [socket, conversation.id, user?.id]);

  const getStatusText = () => {
    if (typingUsers.size > 0) {
      if (isDirect) return <TypingIndicator />;
      const names = Array.from(typingUsers).map(id => {
        const m = conversation.members.find(m => m.userId === id);
        return m?.user?.displayName || m?.user?.username || "Someone";
      });
      return (
        <div className="flex items-center text-[#00a884]">
          <span className="mr-1">{names.join(", ")} is </span>
          <TypingIndicator />
        </div>
      );
    }
    if (isDirect && otherMember) {
      return otherMember.isOnline ? "online" : formatLastSeen(otherMember.lastSeen);
    }
    if (!isDirect) {
      return conversation.members.map(m => m.user?.displayName || m.user?.username).join(", ");
    }
    return "";
  };

  return (
    <div className="flex items-center justify-between px-2 py-2 bg-header border-b border-sidebar-border h-[60px]">
      <div className="flex items-center flex-1 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 mr-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0 md:hidden"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className={getAvatarColor(displayName)}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <h2 className="text-base font-medium truncate">{displayName}</h2>
          <div className="text-xs text-muted-foreground truncate h-4">{getStatusText()}</div>
        </div>
      </div>

      <div className="flex items-center space-x-1 text-muted-foreground flex-shrink-0 ml-2">
        <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Search size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
