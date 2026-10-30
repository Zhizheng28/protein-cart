import { ProgressBar } from "../components/ProgressBar";
import { money, moneyShort, plural, weeksToGoal } from "../format";
import type { BankedWeek } from "../store";
import type { Catalog, Profile } from "../types";

interface GoalsProps {
  catalog: Catalog;
  profile: Profile;
  bankedCents: number;
  weeklySavedCents: number;
  history: BankedWeek[];
  cookedInstead: number;
  cookedSavedCents: number;
  storeName: string;
  onChooseGoal: (id: string) => void;
  onEditProfile: () => void;
}

export function Goals({
  catalog,
  profile,
  bankedCents,
  weeklySavedCents,
  history,
  cookedInstead,
  cookedSavedCents,
  storeName,
  onChooseGoal,
  onEditProfile,
}: GoalsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">Goals</span>
        <h2>What your savings are for</h2>
      </div>

      {bankedCents === 0 && (
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

      {bankedCents > 0 && (
        <section className="card flex flex-col gap-1" aria-label="Banked so far">
          <h3 className="mb-1">Banked so far</h3>
          {history.map((entry) => (
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
          <div className="rline rline-total">
            <span>Total</span>
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
      </section>
    </div>
  );
}
