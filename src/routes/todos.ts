import { Hono } from "hono";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";
import { createTodo, InvalidTodoError } from "../db/todos.js";
import { desc, eq } from "drizzle-orm";

const todosRouter = new Hono();

todosRouter.get("/", async (c) => {
  const rows = await db.select().from(todos).orderBy(desc(todos.createdAt));
  return c.json(rows);
});

todosRouter.post("/", async (c) => {
  const body = await c.req.json<{ title: string }>();
  try {
    const row = await createTodo({ title: body.title });
    return c.json(row, 201);
  } catch (err) {
    if (err instanceof InvalidTodoError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

todosRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.select().from(todos).where(eq(todos.id, id));
  if (!row) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(row);
});

todosRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<Partial<typeof todos.$inferInsert>>();
  const [row] = await db.update(todos).set(body).where(eq(todos.id, id)).returning();
  if (!row) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(row);
});

todosRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.delete(todos).where(eq(todos.id, id)).returning();
  if (!row) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json({ ok: true });
});

export default todosRouter;
