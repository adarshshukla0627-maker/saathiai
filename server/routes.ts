import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerChatRoutes } from "./replit_integrations/chat";
import { chatStorage } from "./replit_integrations/chat/storage";
import { conversations } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // register chat routes from the integration
  registerChatRoutes(app);

  // Seed the database with an initial conversation if none exists
  try {
    const existingConvos = await chatStorage.getAllConversations();
    if (existingConvos.length === 0) {
      await chatStorage.createConversation("Guidance Session");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  return httpServer;
}
