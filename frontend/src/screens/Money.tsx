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
}: MoneyProps) {
  const m = evaluation.money;
  const bowl = catalog.bowl_price_cents;
  const bankable = Math.max(0, m.saved_cents);
  const reached = bankedCents >= funGoal.cost_cents;
  const weeksLeft = weeksToGoal(funGoal.cost_cents, bankedCents, m.saved_cents);
  let pace = `About ${plural(weeksLeft ?? 0, "more week")} at this pace.`;
  if (reached) pace = "Goal reached. Go get that ticket.";
  else if (weeksLeft === null) pace = "Bank a week of savings to start filling this.";

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

      <div className="card flex flex-col gap-1.5">
        <span className="text-muted">
          You save vs. {catalog.takeout_meals_per_week} takeout bowls
        </span>
        <span className="big text-teal">{money(m.saved_cents)}</span>
        <span className="note">
          That's <span className="num">{money(m.per_meal_cents)}</span> a meal instead of{" "}
          <span className="num">{money(bowl)}</span>.
        </span>
      </div>

      <Receipt
        label="Savings versus takeout"
        lines={[
          {
            label: `${catalog.takeout_meals_per_week} burrito bowls`,
            value: money(m.takeout_cents),
          },
          { label: "Your grocery cart", value: `−${money(m.grocery_cents)}` },
        ]}
        total={{ label: "Saved this week", value: money(m.saved_cents), tone: "save" }}
      />

      <div className="card flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <h3>Fun money left</h3>
          <span className={`num font-bold ${m.over_budget_cents ? "text-warn" : ""}`}>
            {m.over_budget_cents ? `Over by ${money(m.over_budget_cents)}` : money(m.fun_cents)}
          </span>
        </div>
        <p className="text-muted text-sm">
          Budget <span className="num">{money(m.budget_cents)}</span> minus groceries{" "}
          <span className="num">{money(m.grocery_cents)}</span>.
          {m.over_budget_cents > 0 && " Hitting your protein target costs a bit more this week."}
        </p>
      </div>

      <div className="card flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <h3>{funGoal.name}</h3>
          <span className="chip chip-maize num">
            {money(bankedCents)} / {moneyShort(funGoal.cost_cents)}
          </span>
        </div>
        <ProgressBar
          value={bankedCents}
          max={funGoal.cost_cents}
          label={`Saved toward ${funGoal.name}`}
          spring
        />
        <p className="text-muted text-sm">{pace}</p>
        <button type="button" className="btn btn-ghost" onClick={onBank}>
          Finish week {week} and bank <span className="num">{money(bankable)}</span>
        </button>
      </div>

      <div className="card flex items-center justify-between gap-3">
        <div>
          <h3>Protein today</h3>
          <p className="text-muted text-sm">
            Target about <span className="num">{plan.targetG} g</span>
          </p>
        </div>
        <span className="chip num">{todayProteinG} g planned</span>
      </div>

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
