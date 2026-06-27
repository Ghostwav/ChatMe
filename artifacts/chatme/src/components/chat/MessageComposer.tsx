import { useState, useRef, useEffect } from "react";
import { useSendMessage } from "@workspace/api-client-react";
import { useSocket } from "@/hooks/useSocket";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { MessagePreview } from "@workspace/api-client-react";

interface MessageComposerProps {
  conversationId: number;
  replyTo: MessagePreview | null;
  onCancelReply: () => void;
}

export function MessageComposer({ conversationId, replyTo, onCancelReply }: MessageComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useSendMessage();
  const { startTyping, stopTyping } = useSocket();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    // Emit typing indicator
    startTyping(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;

    sendMessage.mutate({
      conversationId,
      data: {
        type: "text",
        content: text.trim(),
        replyToId: replyTo?.id
      }
    });

    setText("");
    onCancelReply();
    stopTyping(conversationId);
    
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-header px-4 py-2 border-t border-sidebar-border">
      {replyTo && (
        <div className="bg-black/5 dark:bg-white/5 border-l-4 border-primary rounded p-3 mb-2 flex justify-between items-start relative">
          <div className="flex flex-col pr-6">
            <span className="text-sm font-medium text-primary mb-1">{replyTo.senderName}</span>
            <span className="text-sm text-muted-foreground line-clamp-1">{replyTo.content}</span>
          </div>
          <button 
            onClick={onCancelReply}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button className="p-3 text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-1">
          <Smile size={24} />
        </button>
        <button className="p-3 text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-1">
          <Paperclip size={24} />
        </button>
        
        <div className="flex-1 bg-background rounded-lg border-0 overflow-hidden flex items-end">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="w-full max-h-32 bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 outline-none block"
            rows={1}
            style={{ height: "48px" }}
          />
        </div>
        
        <button 
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-3 text-muted-foreground hover:text-primary transition-colors shrink-0 mb-1 disabled:opacity-50"
        >
          <Send size={24} className={text.trim() ? "text-[#00a884]" : ""} />
        </button>
      </div>
    </div>
  );
}
