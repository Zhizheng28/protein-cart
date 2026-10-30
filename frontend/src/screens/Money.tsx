import { ProgressBar } from "../components/ProgressBar";
import { Receipt } from "../components/Receipt";
import { money, moneyShort, plural, priceLabel, weeksToGoal } from "../format";
import type { Catalog, Evaluation, FunGoal, Plan } from "../types";

interface MoneyProps {
  catalog: Catalog;
  plan: Plan;
  evaluation: Evaluation;
  funGoal: FunGoal;
  week: number;
  bankedCents: number;
  cookedInstead: number;
  todayProteinG: number;
  onQuickMeal: () => void;
  onBank: () => void;
  onClaim: () => void;
}

export function Money({
  catalog,
  plan,
  evaluation,
  funGoal,
  week,
  bankedCents,
  cookedInstead,
  todayProteinG,
  onQuickMeal,
  onBank,
  onClaim,
}: MoneyProps) {
  const m = evaluation.money;
  const bowl = catalog.bowl_price_cents;
  const bankable = Math.max(0, m.saved_cents);
  const reached = bankedCents >= funGoal.cost_cents;
  const weeksLeft = weeksToGoal(funGoal.cost_cents, bankedCents, m.saved_cents);
  const leftover = Math.max(0, bankedCents - funGoal.cost_cents);
  let pace = `About ${plural(weeksLeft ?? 0, "more week")} at this pace.`;
  if (reached) {
    pace =
      leftover > 0
        ? `You saved enough. The extra ${money(leftover)} carries over to your next goal.`
        : "You saved exactly enough.";
  } else if (weeksLeft === null) pace = "Bank a week of savings to start filling this.";
  const over = m.over_budget_cents > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">
            Week {week} · {evaluation.price_source.store}
          </span>
          <h2>This week's money</h2>
        </div>
        <button type="button" className="btn btn-primary btn-small shrink-0" onClick={onQuickMeal}>
          I didn't plan
        </button>
      </div>

      <section className="feature flex flex-col gap-4" aria-label="Savings this week">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">
            You save vs. {catalog.takeout_meals_per_week} takeout bowls
          </span>
          <span className="big text-teal-bright">{money(m.saved_cents)}</span>
          <span className="on-navy-muted text-sm">
            <span className="num text-on-navy">{money(m.per_meal_cents)}</span> a meal instead of{" "}
            <span className="num">{money(bowl)}</span>
          </span>
        </div>
        <dl className="border-navy-line grid grid-cols-3 gap-2 border-t pt-4">
          <div className="flex flex-col gap-0.5">
            <dt className="on-navy-muted text-xs">Groceries</dt>
            <dd className="num font-bold">{money(m.grocery_cents)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="on-navy-muted text-xs">{over ? "Over budget" : "Fun money"}</dt>
            <dd className={`num font-bold ${over ? "text-warn-on-navy" : "text-maize"}`}>
              {money(over ? m.over_budget_cents : m.fun_cents)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="on-navy-muted text-xs">Protein / day</dt>
            <dd className="num font-bold">{plan.targetG} g</dd>
          </div>
        </dl>
      </section>

      <Receipt
        title="Takeout vs. your cart"
        lines={[
          {
            label: `${catalog.takeout_meals_per_week} burrito bowls`,
            value: money(m.takeout_cents),
          },
          { label: "Your grocery cart", value: `−${money(m.grocery_cents)}` },
        ]}
        total={{ label: "Saved this week", value: money(m.saved_cents), tone: "save" }}
      />

      <section
        className={`card flex flex-col gap-3 ${reached ? "border-maize! bg-maize-soft!" : ""}`}
        aria-label="Savings goal"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className={`eyebrow ${reached ? "text-ink!" : ""}`}>
              {reached ? "Goal reached" : "Saving for"}
            </span>
            <h3>{funGoal.name}</h3>
          </div>
          <span className="chip chip-maize num bg-surface!">
            {money(Math.min(bankedCents, funGoal.cost_cents))} / {moneyShort(funGoal.cost_cents)}
          </span>
        </div>
        <ProgressBar
          value={bankedCents}
          max={funGoal.cost_cents}
          label={`Saved toward ${funGoal.name}`}
          spring
        />
        <p className={`text-sm ${reached ? "text-ink" : "text-muted"}`}>{pace}</p>
        {reached && (
          <button type="button" className="btn btn-primary" onClick={onClaim}>
            Claim your {funGoal.name.toLowerCase()}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onBank}>
          Finish week {week} and bank <span className="num">{money(bankable)}</span>
        </button>
      </section>

      <section className="card flex items-center justify-between gap-3" aria-label="Protein today">
        <div>
          <h3>Protein today</h3>
          <p className="text-muted text-sm">
            Budget <span className="num">{money(m.budget_cents)}</span> a week · target about{" "}
            <span className="num">{plan.targetG} g</span>
          </p>
        </div>
        <span className="chip num">{todayProteinG} g planned</span>
      </section>

      {cookedInstead > 0 && (
        <p className="note">
          You cooked instead of ordering {plural(cookedInstead, "time")} with "I didn't plan".
        </p>
      )}
      <p className="note">
        Prices: {priceLabel(evaluation.price_source)}. Bowl price assumed{" "}
        <span className="num">{money(bowl)}</span> with tax.
      </p>
    </div>
  );
}
