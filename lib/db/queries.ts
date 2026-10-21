import { query } from "./db";

export interface Recipe {
  recipe_id: number;
  title: string;
  body: string | null;
}

export async function getRecipes(): Promise<Recipe[]> {
  const sql = `SELECT recipe_id, title, body FROM recipes ORDER BY recipe_id ASC LIMIT 10`;
  const result = await query(sql, []);
  return result.rows;
}
