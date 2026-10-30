import { brand } from "../brand";
import { Logo } from "../components/Logo";
import { ProgressBar } from "../components/ProgressBar";
import { Receipt } from "../components/Receipt";
import { demo, evaluate, plansFor } from "../demo/engine";
import { money, moneyShort } from "../format";

// Every number on this page comes from the same data and math as the app,
// for a 170 lb student building muscle on a $90 budget.
const SAMPLE_TARGET_G = 120;
const SAMPLE_BUDGET_CENTS = 9000;
const SAMPLE_DAY = 1;

const samplePlan = plansFor(SAMPLE_TARGET_G)[0];
const sampleDays = samplePlan?.days ?? [];
const sampleWeek = evaluate(sampleDays, SAMPLE_BUDGET_CENTS);
const sample = sampleWeek.money;
const mealsById = new Map(demo.meals.map((meal) => [meal.id, meal]));
const tripGoal = demo.fun_goals.find((goal) => goal.id === "chicago") ?? demo.fun_goals[0];
const weeklyProtein = sampleDays
  .flat()
  .reduce((sum, id) => sum + (mealsById.get(id)?.protein_g ?? 0), 0);
const avgProteinPerMeal = Math.round(weeklyProtein / 21);
const fetched = new Date(`${demo.price_book.fetched_at}T12:00:00`).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const APP_URL = "app/";
const SLOTS = ["Breakfast", "Lunch", "Dinner"];

const STEPS = [
  {
    title: "Answer five questions",
    body: "Your weight, your gym goal, your weekly budget, where you shop, and what you're saving up for.",
  },
  {
    title: "Get a week of meals",
    body: "21 meals that hit a rough protein target at the lowest cost. Swap anything you don't like.",
  },
  {
    title: "Shop one cart",
    body: "Every ingredient in whole packages at Kroger prices. What you save fills a goal you care about.",
  },
];

const PROMISES = [
  {
    title: "No food logging",
    body: "You never type in what you ate. The plan already knows.",
  },
  {
    title: "No calorie counting",
    body: "Protein targets are rough on purpose. Close enough is good enough.",
  },
  {
    title: "A way out of takeout",
    body: "Hungry with no plan? Get a 10-minute meal from what's in your cart.",
  },
];

function CtaButton({ children }: { children: string }) {
  return (
    <a
      href={APP_URL}
      className="btn btn-primary inline-flex items-center justify-center no-underline sm:w-auto sm:px-7"
    >
      {children}
    </a>
  );
}

export function Landing() {
  const tripCents = Math.min(sample.saved_cents, tripGoal?.cost_cents ?? 0);

  return (
    <div className="mx-auto max-w-[1040px]">
      <header
        className="flex items-center justify-between gap-3 pb-4"
        style={{ paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}
      >
        <span className="font-display flex items-center gap-2 text-lg font-bold">
          <span className="bg-ink text-maize grid h-8 w-8 place-items-center rounded-lg">
            <Logo size={18} />
          </span>
          {brand.name}
        </span>
        <a href={APP_URL} className="btn btn-ghost btn-small inline-flex items-center no-underline">
          Try the demo
        </a>
      </header>

      <main className="flex flex-col gap-16 pb-12 md:gap-24">
        {/* Hero */}
        <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.15fr_1fr] md:pt-12">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">For students who lift</span>
            <h1 className="text-[38px] leading-[1.05] md:text-[56px]">{brand.tagline}</h1>
            <p className="text-muted max-w-[34em] text-[17px]">
              Tell us your weight, goal and budget. We plan a week of high-protein meals, fill a
              grocery cart, and show what you save versus takeout. No food logging, ever.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaButton>Build my week</CtaButton>
              <a href="#how" className="text-ink min-h-11 content-center px-1 font-bold underline">
                See how it works
              </a>
            </div>
            <p className="note">Free demo · about 30 seconds · no sign-up</p>
          </div>

          <div className="flex flex-col gap-4" aria-label="Example week">
            <Receipt
              label="One example week"
              lines={[
                {
                  label: `${demo.takeout_meals_per_week} burrito bowls`,
                  value: money(sample.takeout_cents),
                },
                { label: "Your grocery cart", value: `−${money(sample.grocery_cents)}` },
              ]}
              total={{ label: "Saved this week", value: money(sample.saved_cents), tone: "save" }}
            />
            {tripGoal && (
              <div className="card mt-1 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h3>{tripGoal.name}</h3>
                  <span className="chip chip-maize num">
                    {money(tripCents)} / {moneyShort(tripGoal.cost_cents)}
                  </span>
                </div>
                <ProgressBar
                  value={tripCents}
                  max={tripGoal.cost_cents}
                  label={`One week of savings toward ${tripGoal.name}`}
                />
                <p className="text-muted text-sm">One week of cooking gets you most of the way.</p>
              </div>
            )}
          </div>
        </section>

        {/* Numbers */}
        <section aria-label="The numbers" className="grid gap-3 sm:grid-cols-3">
          <div className="card flex flex-col gap-1">
            <span className="big text-[34px]">{money(demo.bowl_price_cents)}</span>
            <span className="text-muted text-sm">a burrito bowl near campus, with tax</span>
          </div>
          <div className="card flex flex-col gap-1">
            <span className="big text-teal text-[34px]">{money(sample.per_meal_cents)}</span>
            <span className="text-muted text-sm">
              a planned meal, with about <span className="num">{avgProteinPerMeal} g</span> of
              protein
            </span>
          </div>
          <div className="card flex flex-col gap-1">
            <span className="big text-[34px]">0</span>
            <span className="text-muted text-sm">meals you have to log or count</span>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="flex scroll-mt-6 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">How it works</span>
            <h2 className="text-[28px] md:text-[34px]">
              From your goal to a full cart in three steps
            </h2>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card flex flex-col gap-2">
                <span className="num bg-maize-soft text-ink grid h-9 w-9 place-items-center rounded-full font-bold">
                  {i + 1}
                </span>
                <h3 className="text-lg">{step.title}</h3>
                <p className="text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Sample day */}
        <section className="grid items-start gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">A real day from the plan</span>
            <h2 className="text-[28px] md:text-[34px]">Meals you'd actually cook</h2>
            <p className="text-muted">
              Built from <span className="num">{sampleWeek.items.length}</span> groceries you buy
              once a week. Most take under 25 minutes, and the plan reuses what's already in your
              cart so nothing goes to waste.
            </p>
          </div>
          <div className="card flex flex-col gap-1">
            {(sampleDays[SAMPLE_DAY] ?? []).map((id, slot) => {
              const meal = mealsById.get(id);
              if (!meal) return null;
              return (
                <div
                  key={`${slot}-${id}`}
                  className="border-line grid grid-cols-[84px_1fr_auto] items-center gap-2.5 border-t py-3 first:border-t-0"
                >
                  <span className="text-muted text-xs font-bold tracking-[.06em] uppercase">
                    {SLOTS[slot]}
                  </span>
                  <span className="font-bold">{meal.name}</span>
                  <span className="chip num">{meal.protein_g} g</span>
                </div>
              );
            })}
            <div className="rline rline-total text-teal">
              <span>Protein for the day</span>
              <span>
                {(sampleDays[SAMPLE_DAY] ?? []).reduce(
                  (sum, id) => sum + (mealsById.get(id)?.protein_g ?? 0),
                  0,
                )}{" "}
                g
              </span>
            </div>
          </div>
        </section>

        {/* Promises */}
        <section aria-label="What we never ask" className="grid gap-3 md:grid-cols-3">
          {PROMISES.map((promise) => (
            <div key={promise.title} className="flex flex-col gap-1.5 border-maize border-l-4 pl-4">
              <h3 className="text-lg">{promise.title}</h3>
              <p className="text-muted">{promise.body}</p>
            </div>
          ))}
        </section>

        {/* Final CTA */}
        <section className="card flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[26px] md:text-[30px]">See your week in 30 seconds</h2>
            <p className="text-muted">Five questions. No account. No logging.</p>
          </div>
          <CtaButton>Build my week</CtaButton>
        </section>
      </main>

      <footer
        className="border-line note flex flex-col gap-1 border-t pt-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
      >
        <p>
          Prices are sample estimates for {demo.price_book.store}, {demo.price_book.location},{" "}
          {fetched}. Bowl price assumed {money(demo.bowl_price_cents)} with tax.
        </p>
        <p>Built by Team 17 for the Michigan Business+Tech Innovation Jam, Fall 2026.</p>
      </footer>
    </div>
  );
}
