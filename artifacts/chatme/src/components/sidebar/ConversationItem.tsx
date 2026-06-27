import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTime, getInitials, getAvatarColor, cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { ConversationSummary, MessagePreview } from "@workspace/api-client-react";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: number;
}

export function ConversationItem({ conversation, isSelected, onClick, currentUserId }: ConversationItemProps) {
  const isDirect = conversation.type === "direct";
  const displayUser = isDirect ? conversation.otherUser : null;
  const displayName = isDirect ? displayUser?.displayName || displayUser?.username || "Unknown" : conversation.name || "Group";
  const avatarUrl = isDirect ? displayUser?.avatarUrl : conversation.avatarUrl;
  
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount || 0;
  
  const renderMessageStatus = (msg: MessagePreview | any) => {
    if (!msg || msg.senderId !== currentUserId) return null;
    if (msg.readBy && msg.readBy.length > 1) { // assuming sender + receiver = 2
      return <CheckCheck className="h-4 w-4 text-blue-500 mr-1 inline" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground mr-1 inline" />;
  };

  const getMessagePreview = (msg: MessagePreview | any) => {
    if (!msg) return "";
    if (msg.isDeleted) return <em className="text-muted-foreground">This message was deleted</em>;
    if (msg.type === "image") return "📷 Photo";
    if (msg.type === "video") return "🎥 Video";
    if (msg.type === "file") return "📄 Document";
    if (msg.type === "voice") return "🎤 Voice message";
    return msg.content || "";
  };

  return (
    <div 
      className={cn(
        "flex items-center px-3 py-2 cursor-pointer transition-colors duration-200 group h-[72px]",
        isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
      )}
      onClick={onClick}
    >
      <div className="relative mr-3 flex-shrink-0">
        <Avatar className="h-[48px] w-[48px]">
          <AvatarImage src={avatarUrl || ""} alt={displayName} />
          <AvatarFallback className={cn("text-white", getAvatarColor(displayName))}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {isDirect && displayUser?.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-sidebar-background"></span>
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full border-b border-sidebar-border group-last:border-0 pb-1">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-medium text-sidebar-foreground truncate pr-2">
            {displayName}
          </span>
          {lastMessage && (
            <span className={cn(
              "text-xs flex-shrink-0",
              unreadCount > 0 ? "text-green-500 font-medium" : "text-muted-foreground"
            )}>
              {formatMessageTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground truncate mr-2 flex items-center min-w-0">
            {lastMessage && renderMessageStatus(lastMessage)}
            <span className="truncate">
              {lastMessage?.senderId !== currentUserId && !isDirect && lastMessage?.sender ? (
                `${lastMessage.sender.displayName || lastMessage.sender.username}: `
              ) : ""}
              {getMessagePreview(lastMessage)}
            </span>
          </div>
          {unreadCount > 0 && (
            <div className="bg-[#00a884] text-white text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center flex-shrink-0">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
