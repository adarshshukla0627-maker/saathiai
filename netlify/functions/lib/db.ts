import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/functions";
import { users, conversations, messages } from "../../shared/schema";

// Initialize DB connection
export function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema: { users, conversations, messages } });
}

