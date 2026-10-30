import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { brand } from "../brand";
import { ErrorCard } from "../components/ErrorCard";
import { Logo } from "../components/Logo";
import { moneyShort } from "../format";
import type { Catalog, Goal, Profile, Store } from "../types";

const GOALS: Goal[] = ["gain", "lean", "maintain"];
const FALLBACK_STORES: Store[] = [
  { id: "kroger", name: "Kroger", available: true, note: "Ann Arbor" },
  { id: "meijer", name: "Meijer", available: false, note: "Coming soon" },
  { id: "costco", name: "Costco", available: false, note: "Coming soon" },
];

interface OnboardingProps {
  catalog: Catalog;
  initial: Profile | null;
  building: boolean;
  error: string | null;
  onSubmit: (profile: Profile, forceSample: boolean) => void;
  onCancel?: () => void;
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function Onboarding({
  catalog,
  initial,
  building,
  error,
  onSubmit,
  onCancel,
}: OnboardingProps) {
  const [weight, setWeight] = useState(String(initial?.weightLb ?? 170));
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? "gain");
  const [budget, setBudget] = useState(String((initial?.budgetCents ?? 9000) / 100));
  const [storeId, setStoreId] = useState(initial?.storeId ?? "kroger");
  const [funGoalId, setFunGoalId] = useState(initial?.funGoalId ?? catalog.fun_goals[0]?.id ?? "");
  const [stores, setStores] = useState<Store[]>(FALLBACK_STORES);

  useEffect(() => {
    api.stores().then(setStores, () => setStores(FALLBACK_STORES));
  }, []);

  function profile(): Profile {
    return {
      weightLb: Math.round(clamp(Number(weight), 90, 350, 170)),
      goal,
      budgetCents: Math.round(clamp(Number(budget), 20, 400, 90)) * 100,
      storeId,
      funGoalId,
    };
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(profile(), false);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="feature flex flex-col gap-3">
        <span className="eyebrow flex items-center gap-2">
          <span className="bg-maize text-navy grid h-6 w-6 place-items-center rounded-md">
            <Logo size={14} />
          </span>
          {brand.name}
        </span>
        <h1 className="text-[28px]">{brand.tagline}</h1>
        <p className="on-navy-muted">
          Five quick questions. We plan a week of chicken, beef and seafood meals, fill a grocery
          cart, and show what you save versus takeout.
        </p>
      </header>

      <form className="card flex flex-col gap-4" onSubmit={submit} noValidate>
        <label className="field" htmlFor="weight">
          Your weight (lb)
          <input
            id="weight"
            className="input num"
            type="number"
            inputMode="numeric"
            min={90}
            max={350}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>

        <fieldset className="field">
          <legend className="mb-1.5">Goal</legend>
          <div className="seg">
            {GOALS.map((id) => (
              <button key={id} type="button" aria-pressed={goal === id} onClick={() => setGoal(id)}>
                {catalog.goal_labels[id]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field" htmlFor="budget">
          Weekly food budget ($)
          <input
            id="budget"
            className="input num"
            type="number"
            inputMode="numeric"
            min={20}
            max={400}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>

        <fieldset className="field">
          <legend className="mb-1.5">Where you shop</legend>
          <div className="seg">
            {stores.map((store) => (
              <button
                key={store.id}
                type="button"
                aria-pressed={storeId === store.id}
                disabled={!store.available}
                onClick={() => setStoreId(store.id)}
              >
                {store.name}
                {!store.available && (
                  <span className="block text-[11px] font-normal">Coming soon</span>
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field" htmlFor="fun">
          Save up for
          <select
            id="fun"
            className="input"
            value={funGoalId}
            onChange={(e) => setFunGoalId(e.target.value)}
          >
            {catalog.fun_goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({moneyShort(g.cost_cents)})
              </option>
            ))}
          </select>
        </label>

        <p className="note">
          No calorie logging. We give you a rough protein target and do the math.
        </p>

        <button className="btn btn-primary" type="submit" disabled={building}>
          {building ? "Building your week…" : "Build my week"}
        </button>
        {onCancel && !building && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Keep my current week
          </button>
        )}
      </form>

      {error && (
        <ErrorCard
          message={error}
          onRetry={() => onSubmit(profile(), false)}
          onUseSample={() => onSubmit(profile(), true)}
        />
      )}
    </div>
  );
}
