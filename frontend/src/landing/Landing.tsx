import type { ReactNode } from "react";
import { brand } from "../brand";
import { Logo } from "../components/Logo";
import { ProgressBar } from "../components/ProgressBar";
import { ProteinTag } from "../components/ProteinTag";
import { Receipt } from "../components/Receipt";
import { demo, evaluate, plansFor } from "../demo/engine";
import { money, moneyShort } from "../format";
import type { ProteinSource } from "../types";

// Every number on this page comes from the same data and math as the app,
// for a 170 lb student building muscle on a $90 budget.
const SAMPLE_TARGET_G = 120;
const SAMPLE_BUDGET_CENTS = 9000;
const SAMPLE_DAY = 2;

const sampleDays = plansFor(SAMPLE_TARGET_G)[0]?.days ?? [];
const sampleWeek = evaluate(sampleDays, SAMPLE_BUDGET_CENTS);
const sample = sampleWeek.money;
const mealsById = new Map(demo.meals.map((meal) => [meal.id, meal]));
const tripGoal = demo.fun_goals.find((goal) => goal.id === "chicago") ?? demo.fun_goals[0];
const proteinOf = (ids: string[]) =>
  ids.reduce((sum, id) => sum + (mealsById.get(id)?.protein_g ?? 0), 0);
const avgProteinPerMeal = Math.round(proteinOf(sampleDays.flat()) / 21);
const fetched = new Date(`${demo.price_book.fetched_at}T12:00:00`).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MENU_SOURCES: ProteinSource[] = ["chicken", "beef", "seafood", "pork"];
const menuBySource = MENU_SOURCES.map((source) => ({
  source,
  dishes: demo.meals.filter((m) => m.kind === "main" && m.protein_source === source),
}));
const weekMix = MENU_SOURCES.map((source) => ({
  source,
  count: sampleDays
    .flatMap((day) => day.slice(1))
    .filter((id) => mealsById.get(id)?.protein_source === source).length,
})).filter((entry) => entry.count > 0);

const APP_URL = "app/";
const SLOTS = ["Breakfast", "Lunch", "Dinner"];

const STEPS = [
  {
    title: "Answer five questions",
    body: "Your weight, your gym goal, your weekly budget, where you shop, and what you're saving up for.",
  },
  {
    title: "Get a week of meals",
    body: "21 familiar meals that hit a rough protein target at the lowest cost. Swap anything you don't like.",
  },
  {
    title: "Shop one cart",
    body: "Every ingredient in whole packages at Kroger prices, sorted by aisle. Your savings fill a goal.",
  },
];

const PROMISES = [
  { title: "No food logging", body: "You never type in what you ate. The plan already knows." },
  {
    title: "No calorie counting",
    body: "Protein targets are rough on purpose. Close enough is good enough.",
  },
  {
    title: "A way out of takeout",
    body: "Hungry with no plan? Get a 10-minute meal from what's in your cart.",
  },
];

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[1080px] ${className}`}
      style={{
        paddingLeft: "max(20px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(20px, env(safe-area-inset-right, 0px))",
      }}
    >
      {children}
    </div>
  );
}

function CtaButton({ children }: { children: string }) {
  return (
    <a
      href={APP_URL}
      className="btn btn-primary inline-flex items-center justify-center sm:w-auto sm:px-8"
    >
      {children}
    </a>
  );
}

export function Landing() {
  const tripCents = Math.min(sample.saved_cents, tripGoal?.cost_cents ?? 0);
  const day = sampleDays[SAMPLE_DAY] ?? [];

  return (
    <>
      {/* Hero: the navy brand band */}
      <section className="bg-navy text-on-navy pb-14 md:pb-20">
        <Container>
          <header
            className="flex items-center justify-between gap-3 pb-6"
            style={{ paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}
          >
            <span className="font-display flex items-center gap-2.5 text-lg font-bold">
              <span className="bg-maize text-navy grid h-8 w-8 place-items-center rounded-lg">
                <Logo size={18} />
              </span>
              {brand.name}
            </span>
            <a href={APP_URL} className="btn btn-on-navy btn-small inline-flex items-center">
              Try the demo
            </a>
          </header>

          <div className="grid items-center gap-10 pt-4 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pt-10">
            <div className="flex flex-col gap-5">
              <span className="eyebrow text-maize!">For students who lift</span>
              <h1 className="text-[40px] leading-[1.04] md:text-[58px]">{brand.tagline}</h1>
              <p className="on-navy-muted max-w-[34em] text-[17px]">
                Tell us your weight, goal and budget. We plan a week of chicken, beef and seafood
                meals, fill a grocery cart, and show what you save versus takeout. No food logging,
                ever.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <CtaButton>Build my week</CtaButton>
                <a
                  href="#how"
                  className="text-on-navy min-h-11 content-center font-bold underline underline-offset-4"
                >
                  See how it works
                </a>
              </div>
              <p className="on-navy-muted text-xs">Free demo · about 30 seconds · no sign-up</p>
            </div>

            <div className="flex flex-col gap-4 text-ink" aria-label="Example week">
              <div className="shadow-[var(--shadow-lg)] rounded-t-2xl">
                <Receipt
                  title="One week · 170 lb · build muscle"
                  lines={[
                    {
                      label: `${demo.takeout_meals_per_week} burrito bowls`,
                      value: money(sample.takeout_cents),
                    },
                    { label: "Your grocery cart", value: `−${money(sample.grocery_cents)}` },
                  ]}
                  total={{
                    label: "Saved this week",
                    value: money(sample.saved_cents),
                    tone: "save",
                  }}
                />
              </div>
              {tripGoal && (
                <div className="card mt-1 flex flex-col gap-2.5 shadow-[var(--shadow-lg)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="eyebrow">Saving for</span>
                      <h3>{tripGoal.name}</h3>
                    </div>
                    <span className="chip chip-maize num">
                      {money(tripCents)} / {moneyShort(tripGoal.cost_cents)}
                    </span>
                  </div>
                  <ProgressBar
                    value={tripCents}
                    max={tripGoal.cost_cents}
                    label={`One week of savings toward ${tripGoal.name}`}
                  />
                  <p className="text-muted text-sm">
                    One week of cooking gets you most of the way.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Numbers */}
      <section aria-label="The numbers" className="bg-surface border-line border-b">
        <Container className="divide-line grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-1 py-6 sm:pr-6">
            <span className="big text-[34px]">{money(demo.bowl_price_cents)}</span>
            <span className="text-muted text-sm">a burrito bowl near campus, with tax</span>
          </div>
          <div className="flex flex-col gap-1 py-6 sm:px-6">
            <span className="big text-teal text-[34px]">{money(sample.per_meal_cents)}</span>
            <span className="text-muted text-sm">
              a planned meal, with about <span className="num">{avgProteinPerMeal} g</span> of
              protein
            </span>
          </div>
          <div className="flex flex-col gap-1 py-6 sm:pl-6">
            <span className="big text-[34px]">0</span>
            <span className="text-muted text-sm">meals you have to log or count</span>
          </div>
        </Container>
      </section>

      <main className="flex flex-col gap-20 py-16 md:gap-28 md:py-24">
        {/* How it works */}
        <Container>
          <section id="how" className="flex scroll-mt-6 flex-col gap-7">
            <div className="flex max-w-[40em] flex-col gap-2">
              <span className="eyebrow">How it works</span>
              <h2 className="text-[30px] md:text-[38px]">
                From your goal to a full cart in three steps
              </h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="card flex flex-col gap-2.5 p-5">
                  <span className="num bg-navy text-maize grid h-9 w-9 place-items-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <h3 className="text-lg">{step.title}</h3>
                  <p className="text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </Container>

        {/* Menu mix */}
        <section className="bg-surface border-line border-y py-16 md:py-20">
          <Container className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="flex flex-col gap-4">
              <span className="eyebrow">The menu</span>
              <h2 className="text-[30px] md:text-[38px]">
                Chicken, beef and seafood. Not chicken every night.
              </h2>
              <p className="text-muted">
                Every week mixes proteins: at least two chicken, two beef and two seafood dinners,
                and lunch never repeats dinner's protein. All meals you already know how to eat.
              </p>
              <div className="flex flex-col gap-2">
                <span className="section-title">This sample week's lunches and dinners</span>
                <div className="flex flex-wrap gap-1.5">
                  {weekMix.map(({ source, count }) => (
                    <ProteinTag key={source} source={source} count={count} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {menuBySource.map(({ source, dishes }) => (
                <div
                  key={source}
                  className="bg-page border-line flex flex-col gap-2.5 rounded-2xl border p-4"
                >
                  <span>
                    <ProteinTag source={source} />
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {dishes.map((dish) => (
                      <li key={dish.id} className="flex items-baseline justify-between gap-3">
                        <span className="font-bold">{dish.name}</span>
                        <span className="num text-muted shrink-0 text-[13px]">
                          {dish.protein_g} g
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Sample day */}
        <Container className="grid items-start gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">A real day from the plan</span>
            <h2 className="text-[30px] md:text-[38px]">
              Three meals, {proteinOf(day)} grams of protein
            </h2>
            <p className="text-muted">
              Built from <span className="num">{sampleWeek.items.length}</span> groceries you buy
              once a week. Most meals take under 25 minutes, and the plan reuses what's already in
              your cart so nothing goes to waste.
            </p>
          </div>
          <div className="card flex flex-col p-5">
            {day.map((id, slot) => {
              const meal = mealsById.get(id);
              if (!meal) return null;
              return (
                <div
                  key={`${slot}-${id}`}
                  className="border-line flex items-center justify-between gap-3 border-t py-3.5 first:border-t-0 first:pt-1"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-muted text-[11px] font-bold tracking-[.08em] uppercase">
                      {SLOTS[slot]}
                    </span>
                    <span className="font-bold">{meal.name}</span>
                    <span>
                      <ProteinTag source={meal.protein_source} />
                    </span>
                  </div>
                  <span className="chip num">{meal.protein_g} g</span>
                </div>
              );
            })}
          </div>
        </Container>

        {/* Promises */}
        <Container>
          <section aria-label="What we never ask" className="grid gap-6 md:grid-cols-3">
            {PROMISES.map((promise) => (
              <div
                key={promise.title}
                className="border-maize flex flex-col gap-1.5 border-l-[3px] pl-4"
              >
                <h3 className="text-lg">{promise.title}</h3>
                <p className="text-muted">{promise.body}</p>
              </div>
            ))}
          </section>
        </Container>
      </main>

      {/* Final CTA */}
      <section className="bg-navy text-on-navy py-14 md:py-16">
        <Container className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[28px] md:text-[34px]">See your week in 30 seconds</h2>
            <p className="on-navy-muted">Five questions. No account. No logging.</p>
          </div>
          <CtaButton>Build my week</CtaButton>
        </Container>
      </section>

      <footer style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))" }}>
        <Container className="note flex flex-col gap-1 pt-6">
          <p>
            Prices are sample estimates for {demo.price_book.store}, {demo.price_book.location},{" "}
            {fetched}. Bowl price assumed {money(demo.bowl_price_cents)} with tax.
          </p>
          <p>Built by Team 17 for the Michigan Business+Tech Innovation Jam, Fall 2026.</p>
        </Container>
      </footer>
    </>
  );
}
