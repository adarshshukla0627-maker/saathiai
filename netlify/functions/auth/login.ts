import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getDb } from "../lib/db";
import { users } from "../../shared/schema";
import crypto from "crypto";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const db = getDb();
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password are required" }),
      };
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    // Verify password
    const [salt, hash] = user.password.split(":");
    const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

    if (newHash !== hash) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      }),
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to login" }),
    };
  }
};

export { handler };

