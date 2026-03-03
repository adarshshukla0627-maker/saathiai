import { z } from "zod";
import { insertConversationSchema, insertMessageSchema, conversations, messages, users } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    signup: {
      method: "POST" as const,
      path: "/api/auth/signup" as const,
      input: z.object({ username: z.string(), email: z.string().email(), password: z.string(), name: z.string().optional() }),
      responses: {
        201: z.object({ message: z.string(), user: z.custom<typeof users.$inferSelect>() }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.object({ message: z.string(), user: z.custom<typeof users.$inferSelect>() }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
      },
    },
  },
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations" as const,
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/conversations/:id" as const,
      responses: {
        200: z.custom<typeof conversations.$inferSelect & { messages: typeof messages.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/conversations" as const,
      input: z.object({ title: z.string().optional() }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/conversations/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    create: {
      method: "POST" as const,
      path: "/api/conversations/:id/messages" as const,
      input: z.object({ content: z.string() }),
      responses: {
        // SSE stream response
        200: z.any(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
