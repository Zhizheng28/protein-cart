import { ProgressBar } from "../components/ProgressBar";
import type { MealSummary, Plan as PlanData } from "../types";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SLOTS = ["Breakfast", "Lunch", "Dinner"];

interface PlanProps {
  plan: PlanData;
  mealsById: Record<string, MealSummary>;
  day: number;
  shuffling: boolean;
  onDay: (day: number) => void;
  onSwap: (slot: number) => void;
  onShuffle: () => void;
}

export function dayProtein(day: string[] | undefined, mealsById: Record<string, MealSummary>) {
  return (day ?? []).reduce((sum, id) => sum + (mealsById[id]?.protein_g ?? 0), 0);
}

export function Plan({ plan, mealsById, day, shuffling, onDay, onSwap, onShuffle }: PlanProps) {
  const meals = plan.days[day] ?? [];
  const protein = dayProtein(meals, mealsById);
  const target = plan.targetG;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">Weekly plan</span>
        <h2>21 meals, about {target} g protein a day</h2>
      </div>

      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Day">
        {DAYS.map((name, i) => (
          <button
            key={name}
            type="button"
            aria-pressed={i === day}
            onClick={() => onDay(i)}
            className={`min-h-11 rounded-[10px] border px-0 text-sm font-bold ${
              i === day ? "bg-ink text-page border-ink" : "bg-surface border-line text-ink"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <section className="card flex flex-col gap-2" aria-label={`${DAYS[day]} meals`}>
        <div className="flex items-center justify-between gap-3">
          <h3>{DAYS[day]}</h3>
          <span className="chip num">
            {protein} g / {target} g
          </span>
        </div>
        <ProgressBar value={protein} max={target} tone="teal" label={`${DAYS[day]} protein`} />
        <ul>
          {meals.map((id, slot) => {
            const meal = mealsById[id];
            if (!meal) return null;
            return (
              <li
                key={`${slot}-${id}`}
                className="border-line grid grid-cols-[84px_1fr_auto] items-center gap-2.5 border-t py-2.5 first:border-t-0"
              >
                <span className="text-muted text-xs font-bold tracking-[.06em] uppercase">
                  {SLOTS[slot]}
                </span>
                <div className="min-w-0">
                  <div className="font-bold">{meal.name}</div>
                  <div className="text-muted text-[13px]">
                    <span className="num">{meal.protein_g} g</span> protein ·{" "}
                    <span className="num">{meal.minutes}</span> min
                    {meal.quick && " · quick"}
                  </div>
                </div>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => onSwap(slot)}
                  aria-label={`Swap ${SLOTS[slot]?.toLowerCase()}: ${meal.name}`}
                >
                  Swap
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="note">
        {protein < target
          ? "A bit under target? Add a yogurt or a glass of milk. No need to count exactly."
          : "You hit your rough protein target today."}
      </p>
      {plan.shortfallG > 0 && (
        <p className="note">
          Your target is high for these meals. A protein shake on training days closes the gap.
        </p>
      )}

      <button type="button" className="btn btn-ghost" onClick={onShuffle} disabled={shuffling}>
        {shuffling ? "Finding a new week…" : "Shuffle the whole week"}
      </button>
    </div>
  );
}
