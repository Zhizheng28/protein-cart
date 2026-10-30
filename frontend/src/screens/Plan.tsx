import { ProgressBar } from "../components/ProgressBar";
import { ProteinTag } from "../components/ProteinTag";
import { mainsMix } from "../food";
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
  const mix = mainsMix(plan.days, mealsById);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">Weekly plan</span>
        <h2>21 meals, about {target} g protein a day</h2>
      </div>

      <section className="flex flex-col gap-2" aria-label="This week's protein mix">
        <span className="section-title">Lunches and dinners this week</span>
        <div className="flex flex-wrap gap-1.5">
          {mix.map(([source, count]) => (
            <ProteinTag key={source} source={source} count={count} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Day">
        {DAYS.map((name, i) => (
          <button
            key={name}
            type="button"
            aria-pressed={i === day}
            onClick={() => onDay(i)}
            className={`min-h-11 rounded-[10px] border px-0 text-sm font-bold ${
              i === day
                ? "bg-navy text-on-navy border-navy shadow-[inset_0_-3px_0_var(--maize)]"
                : "bg-surface border-line text-ink hover:border-muted"
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
        <ul className="mt-1">
          {meals.map((id, slot) => {
            const meal = mealsById[id];
            if (!meal) return null;
            return (
              <li
                key={`${slot}-${id}`}
                className="border-line grid grid-cols-[1fr_auto] items-center gap-3 border-t py-3 first:border-t-0"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-muted text-[11px] font-bold tracking-[.08em] uppercase">
                    {SLOTS[slot]}
                  </span>
                  <span className="font-bold leading-snug">{meal.name}</span>
                  <span className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <ProteinTag source={meal.protein_source} />
                    <span>
                      <span className="num">{meal.protein_g} g</span> protein ·{" "}
                      <span className="num">{meal.minutes}</span> min
                    </span>
                  </span>
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
