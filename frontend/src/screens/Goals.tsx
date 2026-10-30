import { useState } from "react";
import { ProgressBar } from "../components/ProgressBar";
import { money, moneyShort, plural, weeksToGoal } from "../format";
import type { BankedWeek, ClaimedGoal } from "../store";
import type { Catalog, Profile } from "../types";

interface GoalsProps {
  catalog: Catalog;
  profile: Profile;
  bankedCents: number;
  weeklySavedCents: number;
  history: BankedWeek[];
  claimed: ClaimedGoal[];
  cookedInstead: number;
  cookedSavedCents: number;
  storeName: string;
  onChooseGoal: (id: string) => void;
  onReset: () => void;
  onEditProfile: () => void;
}

const RECENT_WEEKS = 4;

export function Goals({
  catalog,
  profile,
  bankedCents,
  weeklySavedCents,
  history,
  claimed,
  cookedInstead,
  cookedSavedCents,
  storeName,
  onChooseGoal,
  onReset,
  onEditProfile,
}: GoalsProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const recent = history.slice(-RECENT_WEEKS);
  const earlier = history.slice(0, -RECENT_WEEKS);
  const earlierCents = earlier.reduce((sum, entry) => sum + entry.savedCents, 0);
  const hasActivity = history.length > 0 || cookedInstead > 0 || claimed.length > 0;
  // One line per goal, however many times it was claimed.
  const spent = new Map<string, { count: number; cents: number }>();
  for (const goal of claimed) {
    const entry = spent.get(goal.name) ?? { count: 0, cents: 0 };
    spent.set(goal.name, { count: entry.count + 1, cents: entry.cents + goal.costCents });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">Goals</span>
        <h2>What your savings are for</h2>
      </div>

      {!hasActivity && (
        <p className="text-muted text-sm">
          Nothing banked yet. Finish your week on the Money tab and the savings land here.
        </p>
      )}

      {catalog.fun_goals.map((goal) => {
        const active = goal.id === profile.funGoalId;
        const weeks = weeksToGoal(goal.cost_cents, bankedCents, weeklySavedCents);
        let pace = "";
        if (weeks === 0) pace = "Reached";
        else if (weeks !== null) pace = `${plural(weeks, "week")} at this pace`;
        return (
          <section
            key={goal.id}
            aria-label={goal.name}
            className={`card flex flex-col gap-2 ${active ? "border-maize! shadow-[inset_0_0_0_1px_var(--maize)]" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3>{goal.name}</h3>
              <span className="num">{moneyShort(goal.cost_cents)}</span>
            </div>
            <ProgressBar
              value={bankedCents}
              max={goal.cost_cents}
              label={`Saved toward ${goal.name}`}
            />
            <div className="flex min-h-11 items-center justify-between gap-3">
              <span className="note">{pace}</span>
              {active ? (
                <span className="chip chip-maize">Saving for this</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => onChooseGoal(goal.id)}
                >
                  Save for this
                </button>
              )}
            </div>
          </section>
        );
      })}

      {hasActivity && (
        <section className="card flex flex-col gap-1" aria-label="Your savings">
          <h3 className="mb-1">Your savings</h3>
          {earlier.length > 0 && (
            <div className="rline">
              <span>
                Weeks {earlier[0]?.week}–{earlier[earlier.length - 1]?.week}
              </span>
              <span className="text-teal">+{money(earlierCents)}</span>
            </div>
          )}
          {recent.map((entry) => (
            <div key={entry.week} className="rline">
              <span>Week {entry.week}</span>
              <span className="text-teal">+{money(entry.savedCents)}</span>
            </div>
          ))}
          {cookedInstead > 0 && (
            <div className="rline">
              <span>Cooked instead ×{cookedInstead}</span>
              <span className="text-teal">+{money(cookedSavedCents)}</span>
            </div>
          )}
          {[...spent.entries()].map(([name, entry]) => (
            <div key={name} className="rline">
              <span className="min-w-0 truncate">
                {name}
                {entry.count > 1 && ` ×${entry.count}`}
              </span>
              <span>−{money(entry.cents)}</span>
            </div>
          ))}
          <div className="rline rline-total">
            <span>Available now</span>
            <span>{money(bankedCents)}</span>
          </div>
        </section>
      )}

      <section className="card flex flex-col gap-2.5" aria-label="Your setup">
        <h3>Your setup</h3>
        <p className="text-muted text-sm">
          <span className="num">{profile.weightLb}</span> lb · {catalog.goal_labels[profile.goal]} ·{" "}
          <span className="num">{money(profile.budgetCents)}</span> a week · {storeName}
        </p>
        <button type="button" className="btn btn-ghost" onClick={onEditProfile}>
          Change my answers
        </button>
        {confirmingReset ? (
          <div className="bg-warn-soft flex flex-col gap-2.5 rounded-xl p-3" role="alert">
            <p className="text-sm">
              This clears your savings and goal history and starts again at week 1. Your answers and
              meal plan stay.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-warn text-white dark:text-[#16213a]"
                onClick={() => {
                  setConfirmingReset(false);
                  onReset();
                }}
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          hasActivity && (
            <button
              type="button"
              className="text-muted min-h-11 text-sm font-bold underline underline-offset-4"
              onClick={() => setConfirmingReset(true)}
            >
              Reset progress
            </button>
          )
        )}
      </section>
    </div>
  );
}
