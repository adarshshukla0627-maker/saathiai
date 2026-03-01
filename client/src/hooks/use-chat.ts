import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";

// Because we don't have direct export of the types from @shared/routes in context,
// we will type them explicitly based on the manifest provided.
export type Conversation = {
  id: number;
  title: string;
  createdAt: string | Date;
};

export type Message = {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string | Date;
};

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery<ConversationWithMessages>({
    queryKey: [`/api/conversations/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`, { credentials: "include" });
      if (res.status === 404) throw new Error("Not found");
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: id !== null && !isNaN(id),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data?: { title?: string }) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json() as Promise<Conversation>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/c/${data.id}`);
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 404) throw new Error("Failed to delete conversation");
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      // If we are currently on this conversation, navigate home
      if (window.location.pathname === `/c/${id}`) {
        setLocation("/");
      }
    },
  });
}

export function useChatStream(conversationId: number) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    setStreamedContent("");

    // Optimistically update the local cache to show the user's message immediately
    queryClient.setQueryData([`/api/conversations/${conversationId}`], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          {
            id: Date.now(), // Temporary ID
            conversationId,
            role: "user",
            content,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setStreamedContent((prev) => prev + data.content);
                }
                if (data.done) {
                  queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                // ignore parse errors for partial chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); // Update titles/timestamps in sidebar
    }
  }, [conversationId, queryClient]);

  return { sendMessage, isStreaming, streamedContent };
}
