import type { Aisle, MealSummary, ProteinSource } from "./types";

export const PROTEIN_LABELS: Record<ProteinSource, string> = {
  chicken: "Chicken",
  beef: "Beef",
  seafood: "Seafood",
  pork: "Pork",
  eggs: "Eggs",
  dairy: "Dairy",
};

/** Store sections, in the order you walk them. */
export const AISLES: { id: Aisle; label: string }[] = [
  { id: "produce", label: "Produce & frozen" },
  { id: "meat", label: "Meat & seafood" },
  { id: "dairy", label: "Dairy & eggs" },
  { id: "grains", label: "Bread, rice & pasta" },
  { id: "pantry", label: "Pantry" },
];

/** How many lunches and dinners use each protein, most first. */
export function mainsMix(days: string[][], mealsById: Record<string, MealSummary>) {
  const counts = new Map<ProteinSource, number>();
  for (const day of days) {
    for (const id of day.slice(1)) {
      const source = mealsById[id]?.protein_source;
      if (source) counts.set(source, (counts.get(source) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
