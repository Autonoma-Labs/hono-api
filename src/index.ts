import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import todosRouter from "./routes/todos.js";
import autonomaRouter from "./routes/autonoma.js";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/todos", todosRouter);
app.route("/api/autonoma", autonomaRouter);

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`hono-api running on http://localhost:${port}`);
});
