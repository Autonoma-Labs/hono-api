import { Hono } from "hono";
import { createHonoHandler } from "@autonoma-ai/server-hono";
import { defineFactory, type SQLExecutor } from "@autonoma-ai/sdk";
import { z } from "zod";
import { pool } from "../db/index.js";
import { createTodo } from "../db/todos.js";

function pgExecutor(p: typeof pool): SQLExecutor {
  return {
    async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
      const { rows } = await p.query(sql, params);
      return rows as T[];
    },
    async transaction<T>(fn: (tx: SQLExecutor) => Promise<T>): Promise<T> {
      const client = await p.connect();
      await client.query("BEGIN");
      try {
        const tx: SQLExecutor = {
          async query<U = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<U[]> {
            const { rows } = await client.query(sql, params);
            return rows as U[];
          },
          transaction: (innerFn) => innerFn(tx),
        };
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

const autonomaRouter = new Hono();

autonomaRouter.post(
  "/",
  createHonoHandler({
    executor: pgExecutor(pool),
    scopeField: "id",
    tableNameMap: {
      Todo: "todos",
    },
    sharedSecret: process.env.AUTONOMA_SHARED_SECRET ?? "my-shared-secret",
    signingSecret: process.env.AUTONOMA_SIGNING_SECRET ?? "my-signing-secret",
    allowProduction: true,
    factories: {
      Todo: defineFactory({
        inputSchema: z.object({
          title: z.string(),
          completed: z.boolean().optional(),
        }),
        create: async (data) => {
          const row = await createTodo({
            title: data.title,
            completed: data.completed,
          });
          return row as Record<string, unknown>;
        },
      }),
    },
    auth: async () => {
      return { headers: { Authorization: "Bearer no-auth" } };
    },
  }),
);

export default autonomaRouter;
