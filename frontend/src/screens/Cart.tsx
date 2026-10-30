import { Receipt } from "../components/Receipt";
import { AISLES } from "../food";
import { money, plural, priceLabel } from "../format";
import type { Evaluation } from "../types";

interface CartProps {
  evaluation: Evaluation;
  sending: boolean;
  onSend: () => void;
  onBuildWeek: () => void;
}

export function Cart({ evaluation, sending, onSend, onBuildWeek }: CartProps) {
  const { items, money: m, price_source: source } = evaluation;

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <span className="eyebrow">Grocery cart</span>
          <h2>Your cart is empty</h2>
        </div>
        <p className="text-muted">Build a week of meals and we fill the cart for you.</p>
        <button type="button" className="btn btn-primary" onClick={onBuildWeek}>
          Build my week
        </button>
      </div>
    );
  }

  const left = m.budget_cents - m.grocery_cents;
  const sections = AISLES.map((aisle) => ({
    ...aisle,
    items: items.filter((item) => item.aisle === aisle.id),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Grocery cart</span>
          <h2>
            {plural(items.length, "item")} at {source.store}
          </h2>
        </div>
        <span className="chip chip-maize num mt-1">{money(m.grocery_cents)}</span>
      </div>
      <p className="note -mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {source.is_sample && <span className="chip chip-maize">Sample prices</span>}
        <span>{priceLabel(source, !source.is_sample)}</span>
      </p>

      {sections.map((section) => {
        const subtotal = section.items.reduce((sum, item) => sum + item.cost_cents, 0);
        return (
          <section key={section.id} className="card py-2" aria-label={section.label}>
            <div className="border-line flex items-baseline justify-between gap-3 border-b pt-1 pb-2">
              <h3 className="section-title">{section.label}</h3>
              <span className="num text-muted text-[13px]">{money(subtotal)}</span>
            </div>
            <ul>
              {section.items.map((item) => (
                <li
                  key={item.ingredient_id}
                  className="border-line grid grid-cols-[1fr_auto_auto] items-center gap-2.5 border-t py-2.5 first:border-t-0"
                >
                  <div className="min-w-0">
                    <div className="leading-snug font-bold">{item.product_name}</div>
                    <div className="text-muted text-[13px]">
                      used in {plural(item.meals_using, "meal")}
                    </div>
                  </div>
                  <span
                    className="num text-muted text-[13px]"
                    aria-label={`${item.packages} packages`}
                  >
                    ×{item.packages}
                  </span>
                  <span className="num">{money(item.cost_cents)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <Receipt
        title={`${source.store} · this week`}
        lines={[
          { label: "Cart total", value: money(m.grocery_cents) },
          { label: "Per meal", value: money(m.per_meal_cents) },
        ]}
        total={
          left >= 0
            ? { label: "Left in budget", value: money(left) }
            : { label: "Over budget", value: money(-left), tone: "warn" }
        }
      />

      <button type="button" className="btn btn-primary" onClick={onSend} disabled={sending}>
        {sending ? "Getting your cart ready…" : `Send cart to ${source.store}`}
      </button>
      <p className="note">
        Whole packages only, so leftovers carry into next week. No order is placed until you check
        out in the store's app.
      </p>
    </div>
  );
}
