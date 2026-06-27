import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useListUsers, useCreateConversation } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (conversationId: number) => void;
}

export function NewGroupDialog({ open, onOpenChange, onGroupCreated }: NewGroupDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");
  
  const { data: users = [] } = useListUsers(
    { search: search || undefined },
    { query: { enabled: open && step === 1 } as any }
  );
  
  const createConversation = useCreateConversation();

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    
    createConversation.mutate(
      { 
        data: { 
          type: "group", 
          memberIds: selectedUserIds,
          name: groupName.trim()
        } 
      },
      {
        onSuccess: (conv) => {
          onOpenChange(false);
          setStep(1);
          setSelectedUserIds([]);
          setGroupName("");
          onGroupCreated(conv.id);
        }
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setSelectedUserIds([]);
      setGroupName("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-sidebar border-sidebar-border">
        {step === 1 ? (
          <>
            <DialogHeader className="p-4 pb-2 bg-sidebar-accent">
              <DialogTitle>Add group members</DialogTitle>
            </DialogHeader>
            
            <div className="px-4 py-2 border-b border-sidebar-border bg-sidebar">
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 max-h-[100px] overflow-y-auto">
                  {selectedUserIds.map(id => {
                    const user = users.find(u => u.id === id);
                    if (!user) return null;
                    return (
                      <div key={id} className="flex items-center bg-sidebar-accent rounded-full pl-1 pr-2 py-1">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback className={cn("text-[10px]", getAvatarColor(user.displayName || user.username))}>
                            {getInitials(user.displayName || user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm mr-2">{user.displayName?.split(' ')[0] || user.username}</span>
                        <button onClick={() => toggleUser(id)} className="text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
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

            <div className="overflow-y-auto h-[300px]">
              {users.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="flex items-center px-4 py-3 hover:bg-sidebar-accent cursor-pointer border-b border-sidebar-border last:border-0 relative"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={user.avatarUrl || ""} />
                        <AvatarFallback className={getAvatarColor(user.displayName || user.username)}>
                          {getInitials(user.displayName || user.username)}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-[#00a884] rounded-full p-0.5 border-2 border-sidebar">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-medium truncate">{user.displayName || user.username}</h4>
                      {user.statusText && (
                        <p className="text-sm text-muted-foreground truncate">{user.statusText}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <DialogFooter className="p-4 bg-sidebar border-t border-sidebar-border sm:justify-center">
              {selectedUserIds.length > 0 && (
                <Button 
                  onClick={() => setStep(2)} 
                  className="bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full w-12 h-12 p-0 shadow-lg"
                >
                  <Check size={24} />
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-4 pb-2 bg-sidebar-accent">
              <div className="flex items-center">
                <button onClick={() => setStep(1)} className="mr-4 text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
                <DialogTitle>New group subject</DialogTitle>
              </div>
            </DialogHeader>
            
            <div className="p-8 flex flex-col items-center">
              <div className="w-48 h-48 bg-sidebar-accent rounded-full flex items-center justify-center mb-8">
                <span className="text-5xl text-muted-foreground">📷</span>
              </div>
              
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group subject"
                className="w-full border-0 border-b-2 border-[#00a884] rounded-none focus-visible:ring-0 px-0 text-lg bg-transparent"
                autoFocus
              />
            </div>
            
            <DialogFooter className="p-4 bg-sidebar sm:justify-center">
              <Button 
                onClick={handleCreateGroup} 
                disabled={!groupName.trim() || createConversation.isPending}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full w-12 h-12 p-0 shadow-lg disabled:opacity-50"
              >
                <Check size={24} />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
