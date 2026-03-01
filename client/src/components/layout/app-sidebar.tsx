import { Link, useLocation } from "wouter";
import { MessageSquare, Plus, Trash2, Home, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";

export function AppSidebar() {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const createChat = useCreateConversation();
  const deleteChat = useDeleteConversation();

  const handleNewChat = () => {
    createChat.mutate({ title: "New Conversation" });
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex flex-row items-center gap-x-2">
        <div className="bg-primary/10 text-primary p-2 rounded-xl">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-serif font-semibold text-sidebar-foreground leading-tight">
            Saathi
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Relationship Guide</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <Button 
              onClick={handleNewChat}
              disabled={createChat.isPending}
              className="w-full justify-start gap-x-2 bg-background border border-border text-foreground hover-elevate shadow-sm hover:text-primary transition-colors"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              {createChat.isPending ? "Starting..." : "New Reflection"}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4 mt-2 mb-1">
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground italic">
                Loading history...
              </div>
            ) : conversations?.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground italic">
                No conversations yet.
              </div>
            ) : (
              <SidebarMenu>
                {conversations?.map((conv) => {
                  const isActive = location === `/c/${conv.id}`;
                  return (
                    <SidebarMenuItem key={conv.id}>
                      <div className="group flex items-center justify-between px-2 w-full">
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={`flex-1 ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent/50"}`}
                        >
                          <Link href={`/c/${conv.id}`} className="flex flex-col items-start gap-y-0.5 py-2 h-auto">
                            <span className="line-clamp-1 w-full text-left">{conv.title}</span>
                            <span className="text-[10px] opacity-70">
                              {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this conversation?")) {
                              deleteChat.mutate(conv.id);
                            }
                          }}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 ml-1"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
