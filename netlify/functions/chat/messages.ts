import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getDb } from "../lib/db";
import { messages, conversations } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Mock response for development when no OpenAI key
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const db = getDb();
  const pathParts = event.path.split("/");
  const conversationId = parseInt(pathParts[pathParts.length - 2]);
  
  if (isNaN(conversationId)) {
    return { statusCode: 400, body: "Invalid conversation ID" };
  }
  
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  const { content } = JSON.parse(event.body || "{}");
  
  if (!content) {
    return { statusCode: 400, body: "Message content is required" };
  }
  
  try {
    // Save user message
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content,
      createdAt: Date.now(),
    });
    
    // Get conversation history for context
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    
    // Build response with streaming
    const responseStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        
        // Check if OpenAI key is available
        if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
          try {
            const OpenAI = require("openai");
            const openai = new OpenAI({
              apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
              baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
            });
            
            const chatMessages = [
              {
                role: "system" as const,
                content: `You are an emotionally intelligent Relationship Guidance AI. Your purpose is to help users navigate love, conflict, communication, attachment issues, trust problems, breakups, emotional confusion, and personal growth in relationships. Identity: You are calm, psychologically aware, emotionally mature. You are not dramatic, not preachy, not manipulative. You do not encourage revenge, ego battles, or toxicity. You prioritize emotional responsibility and growth. Language Style: Use natural Hinglish (80% Hindi, 20% English). Sound human and grounded. No filmy lines. No begging tone. No over-motivation. Keep responses medium length (deep but not long). Make it feel like a wise, emotionally secure person speaking. Response Framework: Step 1: Acknowledge the situation clearly. Step 2: Explain what may actually be happening emotionally. Step 3: Encourage the user to reflect on their role. Step 4: Give 2–4 clear, mature action steps. Step 5: Provide a short emotionally mature communication example if relevant. Step 6: End with a calm, strong, emotionally secure line. Rules: Do not blindly blame the partner. Do not immediately suggest breakup. Do not support manipulation or mind games. Encourage emotional stability and self-respect.`
              },
              ...conversationMessages.map((m: any) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              }))
            ];
            
            const stream = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: chatMessages,
              stream: true,
              max_completion_tokens: 4096,
            });
            
            for await (const chunk of stream) {
              const chunkContent = chunk.choices[0]?.delta?.content || "";
              if (chunkContent) {
                fullResponse += chunkContent;
                controller.enqueue(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
              }
            }
          } catch (aiError) {
            console.error("OpenAI error:", aiError);
            // Fall back to mock response
            const words = mockResponse.split(" ");
            for (let i = 0; i < words.length; i++) {
              const chunk = words[i] + (i < words.length - 1 ? " " : "");
              fullResponse += chunk;
              controller.enqueue(`data: ${JSON.stringify({ content: chunk })}\n\n`);
              await new Promise(r => setTimeout(r, 30));
            }
          }
        } else {
          // Use mock response
          const words = mockResponse.split(" ");
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? " " : "");
            fullResponse += chunk;
            controller.enqueue(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            await new Promise(r => setTimeout(r, 30));
          }
        }
        
        // Save assistant message
        await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: fullResponse,
          createdAt: Date.now(),
        });
        
        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
        controller.close();
      }
    });
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
      body: "", // Body is handled by the stream
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send message" }),
    };
  }
};

export { handler };

