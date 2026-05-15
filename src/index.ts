import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { pool } from "./db/index.js";
import todosRouter from "./routes/todos.js";
import autonomaRouter from "./routes/autonoma.js";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/todos", todosRouter);
app.route("/api/autonoma", autonomaRouter);

const port = Number(process.env.PORT ?? 4000);

await migrate();

serve({ fetch: app.fetch, port }, () => {
  console.log(`hono-api running on http://localhost:${port}`);
});
