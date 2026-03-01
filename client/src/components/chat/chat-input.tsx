import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "inherit";
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-end w-full max-w-4xl mx-auto bg-card rounded-2xl border border-border shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all p-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share what's on your mind..."
        disabled={disabled}
        className="w-full max-h-[200px] min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] placeholder:text-muted-foreground disabled:opacity-50 text-foreground"
        rows={1}
      />
      <div className="shrink-0 mb-1 mr-1 ml-2">
        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          size="icon"
          className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-40 shadow-sm"
        >
          {disabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
