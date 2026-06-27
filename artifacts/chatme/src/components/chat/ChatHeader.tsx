import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@workspace/api-client-react";
import { getInitials, getAvatarColor, formatLastSeen } from "@/lib/utils";
import { Search, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { TypingIndicator } from "./TypingIndicator";

interface ChatHeaderProps {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  
  const isDirect = conversation.type === "direct";
  
  // Find the other user in a direct chat
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
          if (isTyping) next.add(userId);
          else next.delete(userId);
          return next;
        });
      }
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
    };
  }, [socket, conversation.id, user?.id]);

  const getStatusText = () => {
    if (typingUsers.size > 0) {
      if (isDirect) return <TypingIndicator />;
      
      const typingUserIds = Array.from(typingUsers);
      const typingNames = typingUserIds.map(id => {
        const member = conversation.members.find(m => m.userId === id);
        return member?.user?.displayName || member?.user?.username || "Someone";
      });
      
      return (
        <div className="flex items-center text-[#00a884]">
          <span className="mr-1">{typingNames.join(", ")} is </span>
          <TypingIndicator />
        </div>
      );
    }
    
    if (isDirect && otherMember) {
      if (otherMember.isOnline) return "online";
      return formatLastSeen(otherMember.lastSeen);
    }
    
    if (!isDirect) {
      return conversation.members.map(m => m.user?.displayName || m.user?.username).join(", ");
    }
    
    return "";
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-header border-b border-sidebar-border h-[60px]">
      <div className="flex items-center cursor-pointer flex-1 min-w-0">
        <Avatar className="h-10 w-10 mr-4 flex-shrink-0">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className={getAvatarColor(displayName)}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <h2 className="text-base font-medium truncate">{displayName}</h2>
          <div className="text-xs text-muted-foreground truncate h-4">
            {getStatusText()}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-muted-foreground flex-shrink-0 ml-4">
        <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Search size={20} />
        </button>
        <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
