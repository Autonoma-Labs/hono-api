import { db } from "./index.js";
import { todos } from "./schema.js";

export type CreateTodoInput = {
  title: string;
  completed?: boolean;
};

export class InvalidTodoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTodoError";
  }
}

export async function createTodo(input: CreateTodoInput) {
  const title = input.title?.trim();
  if (!title) {
    throw new InvalidTodoError("title is required");
  }
  const values: { title: string; completed?: boolean } = { title };
  if (typeof input.completed === "boolean") {
    values.completed = input.completed;
  }
  const [row] = await db.insert(todos).values(values).returning();
  return row;
}
