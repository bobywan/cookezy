export type Ingredient = {
  quantity: number;
  unit: string;
  name: string;
};

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: "entrée" | "plat" | "dessert" | "snack";
  difficulty: "facile" | "moyen" | "difficile";
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
};
