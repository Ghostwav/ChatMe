import { useState } from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAuth } from "@/context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  if (!user) return null;

  const handleSelect = (id: number) => {
    setSelectedConversationId(id);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
  };

  return (
    <div className="h-[100dvh] w-full bg-background overflow-hidden flex">
      <div className="absolute top-0 left-0 w-full h-32 bg-[#00a884] dark:bg-[#202c33] -z-10 hidden md:block" />

      <div className="w-full h-full md:p-4 lg:py-6 lg:px-20 max-w-[1600px] mx-auto z-0 flex">
        <div className="w-full h-full bg-background md:shadow-md md:rounded-lg overflow-hidden flex flex-col">

          {/* ── MOBILE layout ── */}
          <div className="flex flex-col h-full md:hidden">
            {selectedConversationId ? (
              <ChatPanel
                conversationId={selectedConversationId}
                onBack={handleBack}
              />
            ) : (
              <ConversationList
                selectedId={selectedConversationId}
                onSelect={handleSelect}
              />
            )}
          </div>

          {/* ── DESKTOP layout ── */}
          <ResizablePanelGroup direction="horizontal" className="h-full items-stretch hidden md:flex">
            <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
              <ConversationList
                selectedId={selectedConversationId}
                onSelect={handleSelect}
              />
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-sidebar-border" />

            <ResizablePanel defaultSize={70} minSize={60} className="flex flex-col h-full bg-chat-bg relative">
              {selectedConversationId ? (
                <ChatPanel conversationId={selectedConversationId} onBack={handleBack} />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-64 h-64 mb-8 opacity-10">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-foreground">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-light text-foreground mb-4">ChatMe for Web</h2>
                  <p className="text-muted-foreground max-w-md">
                    Send and receive messages without keeping your phone online.
                  </p>
                  <div className="absolute bottom-10 flex flex-col items-center gap-1 text-sm text-muted-foreground">
                    <span>End-to-end encrypted</span>
                    <span>by <span className="font-semibold text-[#00a884]">Ghostwav</span></span>
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
