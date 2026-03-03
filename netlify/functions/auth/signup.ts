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
    const { username, email, password, name } = JSON.parse(event.body || "{}");

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username, email, and password are required" }),
      };
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email already registered" }),
      };
    }

    const existingUsername = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });

    if (existingUsername) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username already taken" }),
      };
    }

    // Hash the password
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    const hashedPassword = `${salt}:${hash}`;

    // Create user
    const [user] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      name: name || null,
      avatar: null,
      createdAt: Date.now(),
    }).returning();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User created successfully",
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
    console.error("Signup error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create user" }),
    };
  }
};

export { handler };

