import { Message } from "@workspace/api-client-react";
import { formatMessageTime, cn } from "@/lib/utils";
import { Check, CheckCheck, Reply, SmilePlus, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useDeleteMessage } from "@workspace/api-client-react";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showTail: boolean;
  onReply: () => void;
}

export function MessageBubble({ message, isMine, showTail, onReply }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const deleteMessage = useDeleteMessage();

  const handleDelete = () => {
    if (isMine) {
      deleteMessage.mutate({ messageId: message.id });
    }
  };

  const renderStatus = () => {
    if (!isMine) return null;
    if (message.readBy && message.readBy.length > 1) { // includes sender + at least 1 other
      return <CheckCheck size={14} className="text-blue-500 inline-block ml-1" />;
    }
    return <Check size={14} className="text-muted-foreground inline-block ml-1" />;
  };

  if (message.isDeleted) {
    return (
      <div className={cn(
        "flex mb-1 w-full",
        isMine ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm text-muted-foreground italic text-[14.2px] relative",
          isMine ? "bg-bubble-sent rounded-tr-none" : "bg-bubble-received rounded-tl-none"
        )}>
          This message was deleted
          <div className="float-right mt-2 ml-2 text-[10px]">
            {formatMessageTime(message.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex mb-0.5 w-full group relative",
        isMine ? "justify-end" : "justify-start",
        showTail ? "mb-2" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div className={cn(
            "max-w-[65%] rounded-lg px-2 pt-1.5 pb-2 shadow-sm text-[14.2px] leading-relaxed relative",
            isMine ? "bg-bubble-sent text-foreground" : "bg-bubble-received text-foreground",
            showTail && isMine ? "rounded-tr-none" : "",
            showTail && !isMine ? "rounded-tl-none" : "",
            !showTail && isMine ? "mr-[8px]" : "",
            !showTail && !isMine ? "ml-[8px]" : ""
          )}>
            {/* Tail */}
            {showTail && isMine && (
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-2 text-bubble-sent">
                <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" fill="currentColor"></path>
                <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" fill="currentColor"></path>
              </svg>
            )}
            {showTail && !isMine && (
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-2 text-bubble-received">
                <path opacity=".13" d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" fill="currentColor"></path>
                <path d="M1.533 2.568L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z" fill="currentColor"></path>
              </svg>
            )}

            {/* Sender name in groups */}
            {!isMine && message.sender && (
              <div className="text-[12.5px] font-medium text-[#ea0038] mb-1">
                {message.sender.displayName || message.sender.username}
              </div>
            )}

            {/* Reply block */}
            {message.replyTo && (
              <div className="bg-black/5 dark:bg-white/5 border-l-4 border-primary rounded p-2 mb-1 flex flex-col cursor-pointer">
                <span className="text-xs font-medium text-primary mb-0.5">{message.replyTo.senderName || "Someone"}</span>
                <span className="text-xs text-muted-foreground truncate">{message.replyTo.content || (message.replyTo.type === "image" ? "Photo" : "Message")}</span>
              </div>
            )}

            {/* Content */}
            {message.type === "image" && message.mediaUrl && (
              <img src={message.mediaUrl} alt="uploaded" className="rounded max-h-[300px] w-auto mb-1 cursor-pointer" />
            )}
            
            <div className="break-words whitespace-pre-wrap px-1 relative pb-4">
              {message.content}
              
              {/* Meta timestamp & status */}
              <div className="float-right flex items-center ml-4 mt-2 -mb-2 text-[10.5px] text-muted-foreground">
                <span className="mr-1">{formatMessageTime(message.createdAt)}</span>
                {renderStatus()}
              </div>
            </div>

            {/* Hover Actions */}
            {isHovered && (
              <div className={cn(
                "absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-bubble-sent to-transparent",
                isMine ? "from-bubble-sent via-bubble-sent" : "from-bubble-received via-bubble-received",
                "rounded-tr-lg flex items-center shadow-none"
              )}>
                <EmojiReactionPicker messageId={message.id} />
                <button onClick={onReply} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-muted-foreground">
                  <Reply size={16} />
                </button>
              </div>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="absolute -bottom-3 right-0 bg-background border border-border rounded-full px-1.5 py-0.5 text-xs shadow-sm flex items-center gap-1 z-10">
                {message.reactions.map((r, i) => (
                  <span key={i} title={r.userName}>{r.emoji}</span>
                ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={onReply} className="cursor-pointer">
            Reply
          </ContextMenuItem>
          {isMine && (
            <ContextMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:bg-destructive/10">
              Delete
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
