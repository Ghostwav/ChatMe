import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useListUsers, useCreateConversation } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { Search } from "lucide-react";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (conversationId: number) => void;
}

export function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const [search, setSearch] = useState("");
  const { data: users = [] } = useListUsers(
    { search: search || undefined },
    { query: { enabled: open } as any }
  );
  const createConversation = useCreateConversation();

  const handleStartChat = (userId: number) => {
    createConversation.mutate(
      { data: { type: "direct", memberIds: [userId] } },
      {
        onSuccess: (conv) => {
          onOpenChange(false);
          onChatCreated(conv.id);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-sidebar border-sidebar-border">
        <DialogHeader className="p-4 pb-2 bg-sidebar-accent">
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        
        <div className="px-4 py-2 border-b border-sidebar-border bg-sidebar">
          <div className="relative flex items-center bg-sidebar-accent rounded-md h-9">
            <Search className="absolute left-3 text-muted-foreground" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full h-full pl-10 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No contacts found
            </div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                onClick={() => handleStartChat(user.id)}
                className="flex items-center px-4 py-3 hover:bg-sidebar-accent cursor-pointer border-b border-sidebar-border last:border-0"
              >
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className={getAvatarColor(user.displayName || user.username)}>
                    {getInitials(user.displayName || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-medium truncate">{user.displayName || user.username}</h4>
                  {user.statusText && (
                    <p className="text-sm text-muted-foreground truncate">{user.statusText}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
