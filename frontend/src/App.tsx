import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import { brand } from "./brand";
import { ErrorCard } from "./components/ErrorCard";
import { ScreenSkeleton } from "./components/Skeleton";
import { TabBar } from "./components/TabBar";
import { Toast, useToast } from "./components/Toast";
import { money } from "./format";
import { Cart } from "./screens/Cart";
import { Goals } from "./screens/Goals";
import { Money } from "./screens/Money";
import { Onboarding } from "./screens/Onboarding";
import { Plan, dayProtein } from "./screens/Plan";
import { QuickMealSheet } from "./screens/QuickMealSheet";
import { resetProgress, todayIndex, useSavedState } from "./store";
import type {
  Catalog,
  Evaluation,
  FunGoal,
  MealSummary,
  PlanResponse,
  Profile,
  QuickMeal,
  Tab,
} from "./types";

const MAX_REPEATS = 3;
const SLOT_KINDS = ["breakfast", "main", "main"] as const;

type Remote<T> =
  { status: "loading" } | { status: "ready"; data: T } | { status: "error"; message: string };

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

/** Next meal of the same kind that keeps lunch != dinner and respects the repeat cap. */
function nextMeal(
  days: string[][],
  day: number,
  slot: number,
  meals: MealSummary[],
): string | null {
  const kind = SLOT_KINDS[slot];
  const current = days[day]?.[slot];
  const pool = meals.filter((m) => m.kind === kind);
  const counts = new Map<string, number>();
  for (const id of days.flat()) counts.set(id, (counts.get(id) ?? 0) + 1);
  const start = pool.findIndex((m) => m.id === current);
  for (let step = 1; step < pool.length; step++) {
    const candidate = pool[(start + step) % pool.length];
    if (!candidate) continue;
    const sameDay = days[day]?.some((id, s) => s !== slot && id === candidate.id);
    if (!sameDay && (counts.get(candidate.id) ?? 0) < MAX_REPEATS) return candidate.id;
  }
  return null;
}

export function App() {
  const [saved, setSaved] = useSavedState();
  const [catalog, setCatalog] = useState<Remote<Catalog>>({ status: "loading" });
  const [evaluation, setEvaluation] = useState<Remote<Evaluation>>({ status: "loading" });
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [sending, setSending] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const toast = useToast();
  const closeQuick = useCallback(() => setQuickOpen(false), []);

  const { profile, plan, tab } = saved;
  const onboarding = !profile || !plan || saved.editing;

  const loadCatalog = useCallback(() => {
    setCatalog({ status: "loading" });
    api.catalog().then(
      (data) => setCatalog({ status: "ready", data }),
      (error) => setCatalog({ status: "error", message: errorMessage(error) }),
    );
  }, []);

  useEffect(loadCatalog, [loadCatalog]);

  const reprice = useCallback((forProfile: Profile, days: string[][], forceSample: boolean) => {
    setEvaluation((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
    api.evaluate(forProfile, days, forceSample).then(
      (data) => setEvaluation({ status: "ready", data }),
      (error) => setEvaluation({ status: "error", message: errorMessage(error) }),
    );
  }, []);

  // Price the saved plan once on load. Later changes re-price where they happen.
  useEffect(() => {
    if (profile && plan) reprice(profile, plan.days, saved.useSample);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = brand.name;
  }, []);

  const mealsById = useMemo(() => {
    const map: Record<string, MealSummary> = {};
    if (catalog.status === "ready") for (const meal of catalog.data.meals) map[meal.id] = meal;
    return map;
  }, [catalog]);

  const inCart = useMemo(
    () => (evaluation.status === "ready" ? evaluation.data.items.map((i) => i.ingredient_id) : []),
    [evaluation],
  );

  function applyPlan(response: PlanResponse, forProfile: Profile, forceSample: boolean) {
    setEvaluation({ status: "ready", data: response.evaluation });
    setSaved((s) => ({
      ...s,
      profile: forProfile,
      editing: false,
      useSample: forceSample,
      plan: { days: response.days, targetG: response.target_g, shortfallG: response.shortfall_g },
    }));
  }

  function buildWeek(forProfile: Profile, forceSample: boolean) {
    setBuilding(true);
    setBuildError(null);
    api.plan(forProfile, forceSample).then(
      (response) => {
        applyPlan(response, forProfile, forceSample);
        setSaved((s) => ({ ...s, tab: "money", planDay: todayIndex() }));
        setBuilding(false);
        window.scrollTo(0, 0);
        toast.show("Your week is ready");
      },
      (error) => {
        setBuilding(false);
        setBuildError(errorMessage(error));
      },
    );
  }

  function shuffle() {
    if (!profile) return;
    setShuffling(true);
    const seed = Math.floor(Math.random() * 1_000_000);
    api.plan(profile, saved.useSample, seed, plan?.days).then(
      (response) => {
        applyPlan(response, profile, saved.useSample);
        setShuffling(false);
        toast.show("New week shuffled");
      },
      () => {
        setShuffling(false);
        toast.show("Couldn't shuffle right now. Your week is unchanged.");
      },
    );
  }

  function swap(slot: number) {
    if (!profile || !plan || catalog.status !== "ready") return;
    const replacement = nextMeal(plan.days, saved.planDay, slot, catalog.data.meals);
    if (!replacement) {
      toast.show("No other meal fits this slot");
      return;
    }
    const days = plan.days.map((meals, d) =>
      d === saved.planDay ? meals.map((id, s) => (s === slot ? replacement : id)) : meals,
    );
    setSaved((s) => ({ ...s, plan: { ...plan, days } }));
    reprice(profile, days, saved.useSample);
  }

  /** Bank this week's savings and start next week with a fresh plan. */
  function bank(savedCents: number) {
    if (!profile) return;
    const amount = Math.max(0, savedCents);
    const nextWeek = saved.week + 1;
    setSaved((s) => ({
      ...s,
      bankedCents: s.bankedCents + amount,
      history: [...s.history, { week: s.week, savedCents: amount }],
      week: s.week + 1,
      planDay: todayIndex(),
    }));
    toast.show(`Banked ${money(amount)}. Week ${nextWeek} is planned.`);
    const seed = Math.floor(Math.random() * 1_000_000);
    api.plan(profile, saved.useSample, seed, plan?.days).then(
      (response) => applyPlan(response, profile, saved.useSample),
      () => toast.show(`Banked ${money(amount)}. Keeping this week's meals.`),
    );
  }

  /** Spend the goal amount; leftover savings carry over toward the next one. */
  function claim(goal: FunGoal) {
    setSaved((s) => ({
      ...s,
      bankedCents: Math.max(0, s.bankedCents - goal.cost_cents),
      claimed: [...s.claimed, { name: goal.name, costCents: goal.cost_cents, week: s.week }],
    }));
    toast.show("Enjoy it. Leftover savings now go toward the next one.");
  }

  function cook(meal: QuickMeal, goalName: string) {
    setQuickOpen(false);
    setSaved((s) => ({
      ...s,
      bankedCents: s.bankedCents + meal.saves_cents,
      cookedInstead: s.cookedInstead + 1,
      cookedSavedCents: s.cookedSavedCents + meal.saves_cents,
    }));
    toast.show(`+${money(meal.saves_cents)} toward ${goalName}`);
  }

  function sendCart() {
    setSending(true);
    api.sendCart().then(
      (res) => {
        setSending(false);
        toast.show(res.message);
      },
      () => {
        setSending(false);
        toast.show("Couldn't reach the store. Your cart is still here.");
      },
    );
  }

  function goTo(next: Tab) {
    setSaved((s) => ({ ...s, tab: next }));
    window.scrollTo(0, 0);
  }

  function switchToSample() {
    if (!profile || !plan) return;
    setSaved((s) => ({ ...s, useSample: true }));
    setEvaluation({ status: "loading" });
    reprice(profile, plan.days, true);
  }

  function renderScreen() {
    if (catalog.status === "loading") return <ScreenSkeleton label="Loading your week…" />;
    if (catalog.status === "error") {
      return (
        <div className="flex flex-col gap-4">
          <h2>{brand.name}</h2>
          <div className="card flex flex-col gap-3" role="alert">
            <h3>We couldn't load the app</h3>
            <p className="text-muted text-sm">
              {catalog.message} Check your connection and try again.
            </p>
            <button type="button" className="btn btn-primary" onClick={loadCatalog}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    const cat = catalog.data;

    if (!profile || !plan || saved.editing) {
      return (
        <Onboarding
          catalog={cat}
          initial={profile}
          building={building}
          error={buildError}
          onSubmit={buildWeek}
          onCancel={profile && plan ? () => setSaved((s) => ({ ...s, editing: false })) : undefined}
        />
      );
    }

    if (tab === "plan") {
      return (
        <Plan
          plan={plan}
          mealsById={mealsById}
          day={saved.planDay}
          shuffling={shuffling}
          onDay={(day) => setSaved((s) => ({ ...s, planDay: day }))}
          onSwap={swap}
          onShuffle={shuffle}
        />
      );
    }

    const funGoal = cat.fun_goals.find((g) => g.id === profile.funGoalId) ?? cat.fun_goals[0];
    if (evaluation.status === "loading" || !funGoal) {
      return <ScreenSkeleton label="Getting prices for your cart…" />;
    }
    if (evaluation.status === "error") {
      return (
        <ErrorCard
          message={evaluation.message}
          onRetry={() => reprice(profile, plan.days, saved.useSample)}
          onUseSample={switchToSample}
        />
      );
    }
    const data = evaluation.data;

    if (tab === "cart") {
      return (
        <Cart
          evaluation={data}
          sending={sending}
          onSend={sendCart}
          onBuildWeek={() => buildWeek(profile, saved.useSample)}
        />
      );
    }
    if (tab === "goals") {
      return (
        <Goals
          catalog={cat}
          profile={profile}
          bankedCents={saved.bankedCents}
          weeklySavedCents={data.money.saved_cents}
          history={saved.history}
          claimed={saved.claimed}
          cookedInstead={saved.cookedInstead}
          cookedSavedCents={saved.cookedSavedCents}
          storeName={data.price_source.store}
          onChooseGoal={(id) => {
            setSaved((s) => (s.profile ? { ...s, profile: { ...s.profile, funGoalId: id } } : s));
            const name = cat.fun_goals.find((g) => g.id === id)?.name ?? "";
            toast.show(`Now saving for ${name}`);
          }}
          onReset={() => {
            setSaved(resetProgress);
            toast.show("Progress reset. You're back to week 1.");
          }}
          onEditProfile={() => {
            setBuildError(null);
            setSaved((s) => ({ ...s, editing: true }));
            window.scrollTo(0, 0);
          }}
        />
      );
    }
    return (
      <>
        <Money
          catalog={cat}
          plan={plan}
          evaluation={data}
          funGoal={funGoal}
          week={saved.week}
          bankedCents={saved.bankedCents}
          cookedInstead={saved.cookedInstead}
          todayProteinG={dayProtein(plan.days[todayIndex()], mealsById)}
          onQuickMeal={() => setQuickOpen(true)}
          onBank={() => bank(data.money.saved_cents)}
          onClaim={() => claim(funGoal)}
        />
        {quickOpen && (
          <QuickMealSheet
            storeId={profile.storeId}
            inCart={inCart}
            forceSample={saved.useSample}
            onCook={(meal) => cook(meal, funGoal.name)}
            onClose={closeQuick}
          />
        )}
      </>
    );
  }

  return (
    <>
      <main
        className="mx-auto flex min-h-full max-w-[420px] flex-col"
        style={{
          paddingTop: "calc(20px + env(safe-area-inset-top, 0px))",
          paddingBottom: onboarding ? 32 : 104,
        }}
      >
        {renderScreen()}
      </main>
      {!onboarding && catalog.status === "ready" && <TabBar current={tab} onChange={goTo} />}
      <Toast message={toast.message} />
    </>
  );
}
