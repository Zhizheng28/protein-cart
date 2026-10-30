import type { Tab } from "../types";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "money", label: "Money", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  {
    id: "plan",
    label: "Plan",
    icon: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4",
  },
  { id: "cart", label: "Cart", icon: "M3 4h2l2.4 11h11l2-8H6.2M9 20h.01M18 20h.01" },
  { id: "goals", label: "Goals", icon: "M4 21V4h11l-1.5 4L15 12H4" },
];

interface TabBarProps {
  current: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ current, onChange }: TabBarProps) {
  return (
    <div
      className="bg-surface border-line fixed inset-x-0 bottom-0 z-10 border-t"
      style={{
        paddingTop: 8,
        paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
      }}
    >
      <nav aria-label="Main" className="mx-auto grid max-w-[420px] grid-cols-4 gap-1">
        {TABS.map((tab) => {
          const active = tab.id === current;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(tab.id)}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[10px] text-xs font-bold ${
                active ? "bg-maize-soft text-ink" : "text-muted"
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
