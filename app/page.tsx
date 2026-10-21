import { getRecipes, Recipe } from "@/lib/db/queries";

// Force dynamic rendering since we're fetching from a database
export const dynamic = "force-dynamic";

export default async function Home() {
  const recipes = await getRecipes();
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-4xl font-bold mb-6">Recipe List</h1>
        <ul className="w-full space-y-4">
          {recipes.map((recipe: Recipe) => (
            <li key={recipe.recipe_id} className="p-4 border rounded shadow-sm">
              <h2 className="font-semibold text-lg">{recipe.title}</h2>
              {recipe.body && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                  {recipe.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
