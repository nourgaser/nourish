import React, { useMemo, useState } from "react";
import { Activity, ChefHat, ShoppingCart, Sparkles, Wallet } from "lucide-react";
import { APP_CONFIG, CATEGORIES } from "./data";

const App = () => {
  const [selections, setSelections] = useState({});

  const handleSelect = (categoryId, item) => {
    setSelections((prev) => ({ ...prev, [categoryId]: item }));
  };

  const stats = useMemo(() => {
    let totalCost = 0;
    let totalCals = 0;
    let totalProtein = 0;

    Object.values(selections).forEach((item) => {
      totalCost += item.price;
      totalCals += item.calories;
      totalProtein += item.protein;
    });

    const staplesCals = 3 * 1.3 * 360 + 0.5 * 884 + 0.5 * 304;
    const staplesProtein = 3 * 0.07 * 360;

    const dailyCals = (totalCals + staplesCals) / APP_CONFIG.tripDurationDays;
    const dailyProtein =
      (totalProtein + staplesProtein) / APP_CONFIG.tripDurationDays;

    return { totalCost, dailyCals, dailyProtein };
  }, [selections]);

  const hasFullPlan = Object.keys(selections).length >= CATEGORIES.length;

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-5 sm:max-w-xl sm:px-6 pb-[env(safe-area-inset-bottom)]">
        <header className="rounded-2xl border border-slate-800/70 bg-slate-900/85 px-4 py-4 shadow-xl shadow-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-200">
              <Sparkles size={14} />
              Seoudi Flow
            </div>
            <div className="text-xs text-slate-400">Jan 2026</div>
          </div>
          <div className="mt-3 space-y-1">
            <h1 className="text-2xl font-semibold text-white leading-tight sm:text-3xl">Seoudi Planner</h1>
            <p className="text-sm text-slate-300">
              Target: Weight Gain ({APP_CONFIG.targetDailyCalories} kcal)
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Wallet size={16} />}
            label="Budget"
            value={stats.totalCost}
            limit={APP_CONFIG.budgetLimit}
            isCurrency
          />
          <StatCard
            icon={<Activity size={16} />}
            label="Daily Calories"
            value={Math.round(stats.dailyCals)}
            limit={APP_CONFIG.targetDailyCalories}
          />
          <StatCard
            icon={<ShoppingCart size={16} />}
            label="Protein"
            value={Math.round(stats.dailyProtein)}
            limit={APP_CONFIG.targetDailyProtein}
          />
        </section>

        <section className="flex flex-col gap-5 pb-2">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                  {cat.title}
                </h2>
                <span className="text-[11px] text-slate-500">Pick one</span>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {cat.items.map((item) => {
                  const active = selections[cat.id]?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(cat.id, item)}
                      className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-indigo-400/70 bg-indigo-500/10 ring-2 ring-indigo-400/30"
                          : "border-slate-800/80 bg-slate-900/60 hover:border-indigo-300/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[15px] font-semibold text-white leading-tight">
                            {item.name}
                          </p>
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-1">
                              🔥 {item.calories} kcal
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-1">
                              💪 {item.protein}g prot
                            </span>
                          </div>
                          {item.ibsNote && (
                            <p className="text-xs text-emerald-300/90 leading-snug">{item.ibsNote}</p>
                          )}
                        </div>

                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                          {item.price} EGP
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800/70 bg-slate-900/85 p-5 shadow-lg shadow-slate-950/40 mb-2">
          <div className="flex items-center gap-2 text-indigo-200">
            <ChefHat size={18} />
            <span className="text-[11px] uppercase tracking-[0.2em]">3-day flow</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">Your plan</h3>
          {hasFullPlan ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-100/90">
              <li className="flex gap-3">
                <span className="w-24 text-xs uppercase tracking-wide text-slate-400">Breakfast</span>
                <span>{selections["breakfast"].mealIdea} — boost with honey/nuts</span>
              </li>
              <li className="flex gap-3">
                <span className="w-24 text-xs uppercase tracking-wide text-slate-400">Lunch</span>
                <span>{selections["protein"].mealIdea} + big portion of rice (staple)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-24 text-xs uppercase tracking-wide text-slate-400">Dinner</span>
                <span>Leftovers or {selections["gut"].name} + fruit</span>
              </li>
              <li className="flex gap-3">
                <span className="w-24 text-xs uppercase tracking-wide text-slate-400">Snacks</span>
                <span>{selections["produce"].name} + any extra Rayeb/Yogurt</span>
              </li>
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Choose one option from each section to generate a balanced 3-day flow.
            </p>
          )}
          <p className="mt-4 text-xs text-slate-500 italic">
            Cook the protein on day 1 to save time for the rest of the week.
          </p>
        </section>

        <footer className="pb-4 text-center text-xs text-slate-500">
          Based on Seoudi Market Prices • Jan 2026
        </footer>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, limit, isCurrency }) => {
  const accent = isCurrency
    ? value > limit
      ? "text-rose-200"
      : "text-emerald-200"
    : value >= limit
      ? "text-emerald-200"
      : "text-amber-200";

  const display = isCurrency ? `${value} EGP` : value;
  const target = isCurrency ? `${limit} EGP` : limit;

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-md shadow-slate-950/30">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.25em]">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{display}</div>
      <div className="text-xs text-slate-500">Target {target}</div>
    </div>
  );
};

export default App;
