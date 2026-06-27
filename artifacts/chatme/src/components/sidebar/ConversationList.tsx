import { useState, useMemo } from "react";
import { useListConversations } from "@workspace/api-client-react";
import { ConversationItem } from "./ConversationItem";
import { SearchBar } from "./SearchBar";
import { useAuth } from "@/context/AuthContext";
import { MessageSquarePlus, Users, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";
import { NewChatDialog } from "./NewChatDialog";
import { NewGroupDialog } from "./NewGroupDialog";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";

interface ConversationListProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "group">("all");
  
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data: conversations = [], isLoading } = useListConversations();

  const filteredConversations = useMemo(() => {
    let result = conversations;
    
    if (filter === "group") {
      result = result.filter(c => c.type === "group");
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => {
        const name = c.type === "direct" ? (c.otherUser?.displayName || c.otherUser?.username) : c.name;
        return name?.toLowerCase().includes(q);
      });
    }

    return result.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [conversations, searchQuery, filter]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-sidebar relative">
      {/* Header */}
      <div className="flex-none h-[60px] px-4 py-2 flex items-center justify-between bg-sidebar-accent border-b border-sidebar-border">
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsProfileOpen(true)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl || ""} />
            <AvatarFallback className={getAvatarColor(user.displayName || user.username)}>
              {getInitials(user.displayName || user.username)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex items-center space-x-3 text-muted-foreground">
          <button 
            className="p-2 rounded-full hover:bg-sidebar-accent-foreground/10 transition-colors"
            onClick={() => setIsNewGroupOpen(true)}
            title="New Group"
          >
            <Users size={20} />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-sidebar-accent-foreground/10 transition-colors"
            onClick={() => setIsNewChatOpen(true)}
            title="New Chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-sidebar-accent-foreground/10 transition-colors"
            onClick={() => setIsProfileOpen(true)}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div className="px-3 py-2 flex gap-2 border-b border-sidebar-border bg-sidebar">
        <button
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            filter === "all" ? "bg-sidebar-accent-foreground/10 text-sidebar-foreground" : "text-muted-foreground hover:bg-sidebar-accent-foreground/5"
          )}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            filter === "group" ? "bg-sidebar-accent-foreground/10 text-sidebar-foreground" : "text-muted-foreground hover:bg-sidebar-accent-foreground/5"
          )}
          onClick={() => setFilter("group")}
        >
          Groups
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <MessageSquarePlus size={48} className="mb-4 opacity-20" />
            <p>No conversations found</p>
            <button 
              className="mt-4 text-[#00a884] font-medium hover:underline"
              onClick={() => setIsNewChatOpen(true)}
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
              currentUserId={user.id}
            />
          ))
        )}
      </div>

      <NewChatDialog 
        open={isNewChatOpen} 
        onOpenChange={setIsNewChatOpen} 
        onChatCreated={onSelect}
      />
      
      <NewGroupDialog 
        open={isNewGroupOpen} 
        onOpenChange={setIsNewGroupOpen} 
        onGroupCreated={onSelect}
      />

      <ProfileDrawer 
        open={isProfileOpen} 
        onOpenChange={setIsProfileOpen} 
      />
    </div>
  );
}
