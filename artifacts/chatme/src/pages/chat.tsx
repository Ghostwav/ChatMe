import { useState } from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAuth } from "@/context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  if (!user) return null;

  return (
    <div className="h-[100dvh] w-full bg-background overflow-hidden flex">
      {/* Background decoration for the "WhatsApp web" look */}
      <div className="absolute top-0 left-0 w-full h-32 bg-[#00a884] dark:bg-[#202c33] -z-10 hidden md:block" />
      
      <div className="w-full h-full md:p-4 lg:py-6 lg:px-20 max-w-[1600px] mx-auto z-0 flex">
        <div className="w-full h-full bg-background md:shadow-md md:rounded-lg overflow-hidden flex flex-col">
          <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
            
            <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="flex flex-col h-full bg-sidebar border-r border-sidebar-border min-w-[320px]">
              <ConversationList 
                selectedId={selectedConversationId} 
                onSelect={setSelectedConversationId} 
              />
            </ResizablePanel>
            
            <ResizableHandle className="hidden md:flex w-[1px] bg-sidebar-border" />
            
            <ResizablePanel defaultSize={70} minSize={60} className="flex flex-col h-full bg-chat-bg relative">
              {selectedConversationId ? (
                <ChatPanel conversationId={selectedConversationId} />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-80 h-80 mb-8 opacity-20">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-foreground">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-light text-foreground mb-4">ChatMe for Web</h2>
                  <p className="text-muted-foreground max-w-md">
                    Send and receive messages without keeping your phone online.
                    <br />
                    Use ChatMe on up to 4 linked devices and 1 phone at the same time.
                  </p>
                  <div className="absolute bottom-10 flex flex-col items-center gap-1 text-sm text-muted-foreground">
                    <span>End-to-end encrypted</span>
                    <span>
                      by <span className="font-semibold text-[#00a884]">Ghostwav</span>
                    </span>
                  </div>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
