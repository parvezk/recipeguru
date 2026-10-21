import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
config({ path: ".env.local" });

import { withConnection } from "./db";

async function setup() {
  console.log("🔌 Connecting to Aurora PostgreSQL...");

  const sqlPath = path.join(__dirname, "recipes.sql");
  const sql = readFileSync(sqlPath, "utf8");

  await withConnection(async (client) => {
    console.log("📦 Running recipes.sql (creating tables & seeding data)...");
    await client.query(sql);

    const { rows } = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM recipes) AS recipes_count,
        (SELECT COUNT(*)::int FROM ingredients) AS ingredients_count,
        (SELECT COUNT(*)::int FROM recipes_photos) AS photos_count,
        (SELECT COUNT(*)::int FROM recipe_ingredients) AS recipe_ingredients_count
    `);

    const counts = rows[0];
    console.log(
      `✅ Seeded ${counts.recipes_count} recipes, ${counts.ingredients_count} ingredients, ${counts.photos_count} photos, and ${counts.recipe_ingredients_count} recipe-ingredient links!`,
    );
  });

  console.log("✅ Setup complete!");
}

setup().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
