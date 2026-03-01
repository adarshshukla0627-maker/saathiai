import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useConversation, useChatStream } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { HeartHandshake } from "lucide-react";

export default function ChatPage() {
  const [, params] = useRoute("/c/:id");
  const conversationId = params?.id ? parseInt(params.id) : null;
  
  const { data: conversation, isLoading, isError } = useConversation(conversationId);
  const { sendMessage, isStreaming, streamedContent } = useChatStream(conversationId || 0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamedContent]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background/50">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <HeartHandshake className="w-8 h-8 text-primary/40" />
          <p className="font-serif">Preparing a safe space...</p>
        </div>
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center">
        <h2 className="text-2xl font-serif text-foreground mb-2">Conversation Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          This reflection may have been deleted or doesn't exist. Please select another conversation from the sidebar.
        </p>
      </div>
    );
  }

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const hasMessages = conversation.messages && conversation.messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] dark:bg-background relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-4 bg-background/80 backdrop-blur-md border-b border-border/50 z-10">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h2 className="ml-4 font-serif font-medium text-foreground text-sm truncate">
          {conversation.title}
        </h2>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-36">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-10 opacity-80">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-serif font-medium text-foreground mb-4 leading-tight">
              A safe space for your relationship
            </h2>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              I am Saathi. Share what's on your mind. Whether it's a conflict, an insecurity, or a communication issue, I am here to listen and guide you thoughtfully.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {conversation.messages?.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}
          
          {/* Active Streaming Bubble */}
          {isStreaming && streamedContent && (
            <MessageBubble 
              role="assistant" 
              content={streamedContent} 
              isStreaming={true} 
            />
          )}
          
          {/* Loading state before stream starts */}
          {isStreaming && !streamedContent && (
            <MessageBubble 
              role="assistant" 
              content="" 
              isStreaming={true} 
            />
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FAF9F6] dark:from-background via-[#FAF9F6]/90 dark:via-background/90 to-transparent pt-10">
        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
        <div className="text-center mt-3">
          <span className="text-[11px] text-muted-foreground/60 font-medium tracking-wide uppercase">
            Saathi is an AI. Remember to use your own judgment.
          </span>
        </div>
      </div>
    </div>
  );
}
