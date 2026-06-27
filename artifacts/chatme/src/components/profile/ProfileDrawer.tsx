import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useUpdateProfile, useLogout } from "@workspace/api-client-react";
import { Check, Edit2, LogOut, X, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username);
      setStatusText(user.statusText || "");
    }
  }, [user]);

  if (!user) return null;

  const handleSaveName = () => {
    if (displayName.trim() && displayName !== user.displayName) {
      updateProfile.mutate({ data: { displayName: displayName.trim() } });
    }
    setIsEditingName(false);
  };

  const handleSaveStatus = () => {
    if (statusText !== user.statusText) {
      updateProfile.mutate({ data: { statusText: statusText.trim() } });
    }
    setIsEditingStatus(false);
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent className="w-full sm:w-[360px] h-[100dvh] rounded-none border-r border-sidebar-border bg-sidebar mt-0 flex flex-col">
        <DrawerHeader className="bg-sidebar-primary text-sidebar-primary-foreground h-28 flex items-end pb-4 pt-0 flex-shrink-0">
          <div className="flex items-center w-full">
            <button onClick={() => onOpenChange(false)} className="mr-6">
              <X size={24} />
            </button>
            <DrawerTitle className="text-xl font-medium">Profile</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center py-8 bg-sidebar-accent mb-2">
            <Avatar className="h-[200px] w-[200px] shadow-lg mb-6">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className={`text-6xl text-white ${getAvatarColor(user.displayName || user.username)}`}>
                {getInitials(user.displayName || user.username)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="px-8 py-4 bg-sidebar">
            <div className="mb-2 text-sm text-[#00a884] font-medium">Your name</div>
            <div className="flex items-center justify-between border-b border-sidebar-border pb-2">
              {isEditingName ? (
                <div className="flex items-center w-full">
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border-0 border-b-2 border-[#00a884] rounded-none px-0 h-8 focus-visible:ring-0 text-foreground bg-transparent w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} className="ml-2 text-muted-foreground hover:text-[#00a884]">
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-lg">{user.displayName || user.username}</span>
                  <button onClick={() => setIsEditingName(true)} className="text-muted-foreground hover:text-foreground">
                    <Edit2 size={18} />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4 mb-8">
              This is not your username or pin. This name will be visible to your ChatMe contacts.
            </p>
          </div>

          <div className="px-8 py-4 bg-sidebar">
            <div className="mb-2 text-sm text-[#00a884] font-medium">About</div>
            <div className="flex items-center justify-between border-b border-sidebar-border pb-2">
              {isEditingStatus ? (
                <div className="flex items-center w-full">
                  <Input 
                    value={statusText} 
                    onChange={(e) => setStatusText(e.target.value)}
                    className="border-0 border-b-2 border-[#00a884] rounded-none px-0 h-8 focus-visible:ring-0 text-foreground bg-transparent w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
                  />
                  <button onClick={handleSaveStatus} className="ml-2 text-muted-foreground hover:text-[#00a884]">
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-lg">{user.statusText || "Hey there! I am using ChatMe."}</span>
                  <button onClick={() => setIsEditingStatus(true)} className="text-muted-foreground hover:text-foreground">
                    <Edit2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Support Section */}
          <div className="px-8 py-4 bg-sidebar mt-2">
            <div className="mb-3 text-sm text-[#00a884] font-medium flex items-center gap-2">
              <HeadphonesIcon size={16} />
              Support
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Need help? Reach us on WhatsApp (strictly WhatsApp only):
            </p>
            <div className="space-y-3">
              <a
                href="https://wa.me/2348020841595"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5 flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-foreground font-medium">+234 802 084 1595</span>
              </a>
              <a
                href="https://wa.me/2348054737658"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5 flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-foreground font-medium">+234 805 473 7658</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-8 pb-6 pt-2 bg-sidebar border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mb-4"
            onClick={handleLogout}
          >
            <LogOut className="mr-4" size={20} />
            Log out
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            by <span className="font-semibold text-[#00a884]">Ghostwav</span>
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
