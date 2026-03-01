import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { HeartHandshake, MessageSquarePlus, Sparkles } from "lucide-react";
import { useCreateConversation } from "@/hooks/use-chat";

export default function HomePage() {
  const createChat = useCreateConversation();

  const handleStart = () => {
    createChat.mutate({ title: "New Reflection" });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] dark:bg-background relative">
      <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-4 bg-transparent z-10">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
        {/* Decorative elements */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse [animation-duration:4s]"></div>
          <div className="w-20 h-20 rounded-3xl bg-card border border-border shadow-xl flex items-center justify-center relative z-10 text-primary rotate-3">
            <HeartHandshake className="w-10 h-10 -rotate-3" />
          </div>
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border shadow-sm z-20">
            <Sparkles className="w-4 h-4 text-foreground/70" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4 leading-tight tracking-tight">
          Welcome to Saathi
        </h1>
        
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-sans max-w-lg">
          An emotionally intelligent guide to help you navigate relationship challenges with clarity, empathy, and personal responsibility.
        </p>

        <Button 
          onClick={handleStart} 
          disabled={createChat.isPending}
          size="lg"
          className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-medium text-base gap-x-2 w-full sm:w-auto"
        >
          <MessageSquarePlus className="w-5 h-5" />
          {createChat.isPending ? "Preparing space..." : "Start a Reflection"}
        </Button>
        
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
          <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
            <h3 className="font-serif font-semibold text-foreground mb-2">Pause & Reflect</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Slow down emotional reactions and find clarity before acting.</p>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
            <h3 className="font-serif font-semibold text-foreground mb-2">Self-Awareness</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Shift focus from blaming others to understanding your own needs.</p>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
            <h3 className="font-serif font-semibold text-foreground mb-2">Better Words</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Learn how to express hard feelings without causing harm.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
