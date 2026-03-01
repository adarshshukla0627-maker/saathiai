import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: string;
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex w-full gap-x-4 py-6 px-4 md:px-8 max-w-4xl mx-auto rounded-2xl mb-2 transition-all duration-300",
        isAssistant ? "bg-card shadow-sm border border-border/40" : "bg-transparent"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-1">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border shadow-sm">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="font-serif font-medium text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
          {isAssistant ? "Saathi" : "You"}
          {isStreaming && isAssistant && (
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
            </span>
          )}
        </div>
        
        <div className={cn(
          "prose-chat text-[15px] max-w-none text-foreground break-words",
          !isAssistant && "text-foreground/90 font-medium"
        )}>
          {isAssistant ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || (isStreaming ? "..." : "")}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
