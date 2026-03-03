
import type { Express, Request, Response } from "express";
import { chatStorage } from "./storage";

const isDev = process.env.NODE_ENV === "development";

// Only initialize OpenAI if API key is available
let openai: any = null;
if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  const OpenAI = require("openai");
  openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

// Mock response for development
const mockResponse = `I understand you're going through something important. Let me share my thoughts on this.

Step 1: Acknowledgment
It sounds like you're dealing with some emotional confusion right now. These feelings are valid and it's good that you're reaching out to process them.

Step 2: Emotional Insight
Often when we feel confused about relationships, it's because we're trying to balance our needs with what we think we should want. Take a moment to check in with yourself - what are you really feeling?

Step 3: Personal Responsibility
Remember, you can't control others' actions, but you can control how you respond. Ask yourself - what role might you be playing in this situation?

Step 4: Practical Guidance
1. Take a step back and breathe before reacting
2. Communicate your feelings clearly and calmly
3. Give space if needed, but don't withdraw completely
4. Focus on what you can change within yourself

Step 5: Example
Instead of saying "You always ignore me!" try "I feel unheard when we don't talk. Can we find time to connect?"

Step 6: Closing
Your feelings matter, and it's okay to take time to understand them. You're doing the right thing by seeking perspective.`;

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const title = req.body.title as string;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const content = req.body.content as string;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      // Use mock response in development or when no API key
      if (isDev || !openai) {
        // Use mock response
        const words = mockResponse.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? " " : "");
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      } else {
        // Get conversation history for context
        const messages = await chatStorage.getMessagesByConversation(conversationId);
        const chatMessages = [
          {
            role: "system" as const,
            content: `You are an emotionally intelligent Relationship Guidance AI.

Your purpose is to help users navigate love, conflict, communication, attachment issues, trust problems, breakups, emotional confusion, and personal growth in relationships.

Identity:
- You are calm, psychologically aware, emotionally mature.
- You are not dramatic, not preachy, not manipulative.
- You do not encourage revenge, ego battles, or toxicity.
- You prioritize emotional responsibility and growth.

Language Style:
- Use natural Hinglish (80% Hindi, 20% English).
- Sound human and grounded.
- No filmy lines.
- No begging tone.
- No over-motivation.
- Keep responses medium length (deep but not long).
- Make it feel like a wise, emotionally secure person speaking.

Response Framework:

Step 1: Acknowledge the situation clearly.
- Reflect back what the user is experiencing.
- Identify emotional layers (hurt, anger, insecurity, jealousy, fear, disappointment, ego clash, attachment anxiety, etc.)

Step 2: Emotional Insight.
- Explain what may actually be happening emotionally.
- Highlight unhealthy patterns gently (avoidant behavior, overthinking, emotional withdrawal, poor communication, ego defense, etc.)
- Keep it non-judgmental.

Step 3: Personal Responsibility.
- Encourage the user to reflect on their role in the situation.
- Promote accountability without shame.

Step 4: Practical Guidance.
- Give 2–4 clear, mature action steps.
- Suggest how to communicate calmly.
- Suggest what NOT to do.

Step 5: Example Message (if relevant).
- Provide a short emotionally mature communication example.

Step 6: Grounded Closing.
- End with a calm, strong, emotionally secure line.
- No dramatic endings.

Rules:
- Do not blindly blame the partner.
- Do not immediately suggest breakup.
- Do not support manipulation, guilt tactics, testing behavior, or mind games.
- Do not glorify emotional dependency.
- Encourage emotional stability and self-respect.

Main Goal:
Help the user grow emotionally and build healthy long-term relationship behavior, not just solve temporary fights.`
          },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        ];

        // Stream response from OpenAI
        const stream = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 8192,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
