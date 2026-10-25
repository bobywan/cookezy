import { RecipeAdminLogin } from "@/components/RecipeAdminLogin";
import { RecipeEditor } from "@/components/RecipeEditor";
import { isAdmin } from "@/lib/admin-session";
import type { Recipe } from "@/lib/types";

export async function RecipeAdminGate({ recipe }: { recipe: Recipe }) {
  const allowed = await isAdmin();

  return (
    <div className="mb-6 print:hidden">
      {allowed ? <RecipeEditor recipe={recipe} /> : <RecipeAdminLogin />}
    </div>
  );
}
