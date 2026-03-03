import { db, users } from "../../db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export interface IAuthStorage {
  getUser(id: number): Promise<typeof users.$inferSelect | undefined>;
  getUserByEmail(email: string): Promise<typeof users.$inferSelect | undefined>;
  getUserByUsername(username: string): Promise<typeof users.$inferSelect | undefined>;
  createUser(data: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }): Promise<typeof users.$inferSelect>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  updateUser(id: number, data: Partial<typeof users.$inferSelect>): Promise<typeof users.$inferSelect>;
}

export const authStorage: IAuthStorage = {
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },

  async createUser(data) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(data.password, salt, 1000, 64, "sha512").toString("hex");
    const hashedPassword = `${salt}:${hash}`;
    
    const [user] = await db.insert(users).values({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      name: data.name || null,
      createdAt: Date.now(),
    }).returning();
    return user;
  },

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, hash] = storedHash.split(":");
      const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
      return hash === verifyHash;
    } catch {
      return false;
    }
  },

  async updateUser(id: number, data) {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  },
};

