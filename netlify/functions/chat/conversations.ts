import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getDb } from "../lib/db";
import { conversations } from "../../shared/schema";
import { desc } from "drizzle-orm";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const db = getDb();
  
  try {
    // GET - List all conversations
    if (event.httpMethod === "GET") {
      const result = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }
    
    // POST - Create new conversation
    if (event.httpMethod === "POST") {
      const { title } = JSON.parse(event.body || "{}");
      
      const [conversation] = await db
        .insert(conversations)
        .values({
          title: title || "New Chat",
          userId: null,
          createdAt: Date.now(),
        })
        .returning();
      
      return {
        statusCode: 201,
        body: JSON.stringify(conversation),
      };
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

