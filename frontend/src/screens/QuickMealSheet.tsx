import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { ProteinTag } from "../components/ProteinTag";
import { SkeletonLine } from "../components/Skeleton";
import { money } from "../format";
import type { QuickMeal } from "../types";

interface QuickMealSheetProps {
  storeId: string;
  inCart: string[];
  forceSample: boolean;
  onCook: (meal: QuickMeal) => void;
  onClose: () => void;
}

type Load = { state: "loading" } | { state: "ready"; meals: QuickMeal[] } | { state: "error" };

/** "Hungry and no plan?" bottom sheet: cook a quick meal instead of ordering. */
export function QuickMealSheet({
  storeId,
  inCart,
  forceSample,
  onCook,
  onClose,
}: QuickMealSheetProps) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cartKey = inCart.join(",");

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    setLoad({ state: "loading" });
    api.quickMeals(storeId, cartKey.split(","), forceSample || attempt > 1).then(
      (res) => live && setLoad({ state: "ready", meals: res.meals }),
      () => live && setLoad({ state: "error" }),
    );
    return () => {
      live = false;
    };
  }, [storeId, cartKey, forceSample, attempt]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(10,14,25,.5)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-title"
        className="bg-page flex max-h-[88%] w-full max-w-[452px] flex-col gap-4 overflow-auto rounded-t-[18px] pt-5"
        style={{
          paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
          paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="quick-title">Hungry and no plan?</h2>
          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="text-muted">
          Ready in 15 minutes or less, mostly from what's already in your cart.
        </p>

        {load.state === "loading" && (
          <div className="flex flex-col gap-3" role="status" aria-label="Loading quick meals">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card flex flex-col gap-2">
                <SkeletonLine width="60%" height={18} />
                <SkeletonLine />
                <SkeletonLine width="80%" />
              </div>
            ))}
            <p className="note">Pricing quick meals…</p>
          </div>
        )}

        {load.state === "error" && (
          <div className="card flex flex-col gap-3" role="alert">
            <p>We couldn't price quick meals right now.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAttempt((a) => a + 1)}
            >
              {attempt > 0 ? "Use sample prices" : "Try again"}
            </button>
          </div>
        )}

        {load.state === "ready" &&
          load.meals.map((meal) => (
            <section key={meal.id} className="card flex flex-col gap-2" aria-label={meal.name}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h3>{meal.name}</h3>
                  <ProteinTag source={meal.protein_source} />
                </div>
                <span className="chip num">{meal.protein_g} g</span>
              </div>
              <div className="rline">
                <span>
                  {meal.minutes} min · {meal.in_cart ? "in your cart" : "costs"}
                </span>
                <span>{money(meal.cost_cents)}</span>
              </div>
              <div className="rline text-teal">
                <span>vs. a bowl you save</span>
                <span>{money(meal.saves_cents)}</span>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => onCook(meal)}>
                Cook this instead
              </button>
            </section>
          ))}
      </div>
    </div>
  );
}
