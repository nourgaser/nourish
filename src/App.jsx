import React, { useState, useMemo } from "react";
import { APP_CONFIG, CATEGORIES, STAPLES_PANTRY } from "./data";
import { ShoppingCart, Activity, Wallet, ChefHat } from "lucide-react";

const App = () => {
  const [selections, setSelections] = useState({});

  // Helper to toggle selection
  const handleSelect = (categoryId, item) => {
    setSelections((prev) => ({
      ...prev,
      [categoryId]: item,
    }));
  };

  // --- CALCULATIONS ---
  const stats = useMemo(() => {
    let totalCost = 0;
    let totalCals = 0;
    let totalProtein = 0;

    Object.values(selections).forEach((item) => {
      totalCost += item.price;
      totalCals += item.calories;
      totalProtein += item.protein;
    });

    // Add Staples Estimates (Rice/Oil/Honey) roughly per 3.5 days
    // Assuming 300g rice (dry), 50g oil, 50g honey consumption over 3.5 days
    const staplesCals = 3 * 1.3 * 360 + 0.5 * 884 + 0.5 * 304; // Rough estimate ~2000 cal buffer
    const staplesProtein = 3 * 0.07 * 360;

    const dailyCals = (totalCals + staplesCals) / APP_CONFIG.tripDurationDays;
    const dailyProtein =
      (totalProtein + staplesProtein) / APP_CONFIG.tripDurationDays;

    return { totalCost, dailyCals, dailyProtein };
  }, [selections]);

  // --- MEAL PLAN GENERATOR ---
  const generatePlan = () => {
    if (Object.keys(selections).length < CATEGORIES.length) return null;

    const p = selections["protein"];
    const b = selections["breakfast"];

    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <ChefHat size={20} /> Your 3-Day Plan
        </h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-bold min-w-[80px]">Breakfast:</span>
            <span>{b.mealIdea} (Boost with Honey/Nuts)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold min-w-[80px]">Lunch:</span>
            <span>{p.mealIdea} + Large portion of Rice (Staple)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold min-w-[80px]">Dinner:</span>
            <span>Leftovers or {selections["gut"].name} + Fruit</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold min-w-[80px]">Snacks:</span>
            <span>{selections["produce"].name} + Any extra Rayeb/Yogurt</span>
          </li>
        </ul>
        <div className="mt-4 text-xs text-gray-500 italic">
          * Remember to cook all {p.name} on day 1 to save time!
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen font-sans">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Seoudi Planner</h1>
        <p className="text-slate-500 text-sm">
          Target: Weight Gain ({APP_CONFIG.targetDailyCalories}kcal)
        </p>
      </header>

      {/* --- STATS BAR --- */}
      <div className="grid grid-cols-3 gap-2 mb-6 sticky top-0 bg-white z-10 py-2 shadow-sm border-b">
        <StatCard
          icon={<Wallet size={16} />}
          label="Budget"
          value={`${stats.totalCost} EGP`}
          limit={APP_CONFIG.budgetLimit}
          isCurrency
        />
        <StatCard
          icon={<Activity size={16} />}
          label="Daily Cal"
          value={Math.round(stats.dailyCals)}
          limit={APP_CONFIG.targetDailyCalories}
        />
        <StatCard
          icon={<ShoppingCart size={16} />}
          label="Protein"
          value={`${Math.round(stats.dailyProtein)}g`}
          limit={APP_CONFIG.targetDailyProtein}
        />
      </div>

      {/* --- SELECTION MODULES --- */}
      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">
              {cat.title}
            </h2>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(cat.id, item)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200
                    ${
                      selections[cat.id]?.id === item.id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-slate-800">
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.price} EGP
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span>🔥 {item.calories} kcal</span>
                    <span>💪 {item.protein}g prot</span>
                  </div>
                  {item.ibsNote && (
                    <div className="text-xs text-emerald-600 mt-1">
                      leaf: {item.ibsNote}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- RESULTS --- */}
      {generatePlan()}

      {/* --- FOOTER --- */}
      <div className="mt-8 text-center text-xs text-gray-400 pb-8">
        Based on Seoudi Market Prices • Jan 2026
      </div>
    </div>
  );
};

// Simple reusable card component
const StatCard = ({ icon, label, value, limit, isCurrency }) => {
  const numValue = parseInt(value);
  // Color logic: Green if hitting protein/cal goals, Red if over budget
  let color = "text-slate-800";

  if (isCurrency) {
    color = numValue > limit ? "text-red-600" : "text-emerald-600";
  } else {
    color = numValue >= limit ? "text-emerald-600" : "text-amber-600";
  }

  return (
    <div className="bg-slate-50 p-2 rounded flex flex-col items-center justify-center">
      <div className="text-slate-400 mb-1">{icon}</div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase">{label}</div>
    </div>
  );
};

export default App;
