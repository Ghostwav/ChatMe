import { useReactToMessage } from "@workspace/api-client-react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EmojiReactionPickerProps {
  messageId: number;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "✅"];

export function EmojiReactionPicker({ messageId }: EmojiReactionPickerProps) {
  const reactToMessage = useReactToMessage();

  const handleReact = (emoji: string) => {
    reactToMessage.mutate({ messageId, data: { emoji } });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-muted-foreground transition-colors">
          <SmilePlus size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-popover border-popover-border rounded-full flex gap-1 shadow-lg" sideOffset={5} side="top">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="w-8 h-8 flex items-center justify-center text-xl hover:bg-muted rounded-full transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
