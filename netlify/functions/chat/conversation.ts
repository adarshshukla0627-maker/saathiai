import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getDb } from "../lib/db";
import { conversations, messages } from "../../shared/schema";
import { eq } from "drizzle-orm";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const db = getDb();
  const id = parseInt(event.path.split("/").pop() || "");
  
  if (isNaN(id)) {
    return { statusCode: 400, body: "Invalid conversation ID" };
  }
  
  try {
    // GET - Get single conversation with messages
    if (event.httpMethod === "GET") {
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      
      if (!conversation) {
        return { statusCode: 404, body: JSON.stringify({ error: "Conversation not found" }) };
      }
      
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ ...conversation, messages: conversationMessages }),
      };
    }
    
    // DELETE - Delete conversation
    if (event.httpMethod === "DELETE") {
      await db.delete(messages).where(eq(messages.conversationId, id));
      await db.delete(conversations).where(eq(conversations.id, id));
      
      return { statusCode: 204, body: "" };
    }
    
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};

export { handler };

