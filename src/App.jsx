import React, { useMemo, useState, useEffect } from "react";
import { 
  Activity, ShoppingBag, Wallet, CheckSquare, 
  RefreshCw, ChevronRight, AlertCircle, ShoppingCart 
} from "lucide-react";
import { APP_CONFIG, CATEGORIES, STAPLES_COST, STAPLES_CALORIES, STAPLES_PROTEIN } from "./data";
import { Logo } from "./Logo";

const App = () => {
  // --- STATE ---
  const [selections, setSelections] = useState({});
  const [includeStaples, setIncludeStaples] = useState(false);
  const [viewMode, setViewMode] = useState("plan"); // 'plan' | 'list'

  // --- PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem("nourish_state");
    if (saved) setSelections(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("nourish_state", JSON.stringify(selections));
  }, [selections]);

  const handleSelect = (categoryId, item) => {
    setSelections((prev) => ({ ...prev, [categoryId]: item }));
  };

  const resetPlan = () => {
    if(confirm("Start new week? This clears current selection.")) {
      setSelections({});
      setViewMode("plan");
    }
  };

  // --- CALCULATIONS ---
  const stats = useMemo(() => {
    let tripCost = 0;
    let totalCals = 0;
    let totalProtein = 0;

    Object.values(selections).forEach((item) => {
      tripCost += item.price;
      totalCals += item.calories;
      totalProtein += item.protein;
    });

    // Cost only added if toggle is ON
    const finalCost = includeStaples ? tripCost + STAPLES_COST : tripCost;

    // Calories always added (you eat staples regardless of buying them)
    const dailyCals = (totalCals / APP_CONFIG.tripDurationDays) + STAPLES_CALORIES;
    const dailyProtein = (totalProtein / APP_CONFIG.tripDurationDays) + STAPLES_PROTEIN;

    return { finalCost, dailyCals, dailyProtein };
  }, [selections, includeStaples]);

  const progress = Object.keys(selections).length;
  const isComplete = progress === CATEGORIES.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 pb-24 sm:max-w-xl">
        
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
              <Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">NOURISH</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">Nour Gaser's Kitchen</p>
            </div>
          </div>
          <button 
            onClick={resetPlan}
            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
            title="Reset Plan"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        {/* --- STATS DASHBOARD --- */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <StatCard
            icon={<Wallet size={16} />}
            label="Trip Cost"
            value={stats.finalCost}
            limit={APP_CONFIG.budgetLimit + (includeStaples ? STAPLES_COST : 0)}
            unit="EGP"
            isCurrency
          />
          <StatCard
            icon={<Activity size={16} />}
            label="Daily Cal"
            value={Math.round(stats.dailyCals)}
            limit={APP_CONFIG.targetDailyCalories}
            unit="kcal"
          />
          <StatCard
            icon={<ShoppingBag size={16} />}
            label="Protein"
            value={Math.round(stats.dailyProtein)}
            limit={APP_CONFIG.targetDailyProtein}
            unit="g"
          />
        </section>

        {/* --- STAPLES TOGGLE --- */}
        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${includeStaples ? 'bg-amber-400' : 'bg-slate-600'}`} />
            <span className="text-sm text-slate-300">Refill Staples? <span className="text-xs text-slate-500">(Rice/Oil/Honey)</span></span>
          </div>
          <button 
            onClick={() => setIncludeStaples(!includeStaples)}
            className={`w-11 h-6 flex items-center rounded-full px-1 transition-colors ${includeStaples ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${includeStaples ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* --- VIEW SWITCHER --- */}
        {viewMode === "plan" ? (
          /* --- PLAN MODE --- */
          <div className="flex flex-col gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{cat.title}</h2>
                  {selections[cat.id] && <CheckSquare size={14} className="text-emerald-500" />}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {cat.items.map((item) => {
                    const isSelected = selections[cat.id]?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(cat.id, item)}
                        className={`relative group flex items-start justify-between p-4 rounded-2xl border transition-all duration-300 text-left
                          ${isSelected 
                            ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${isSelected ? "text-rose-100" : "text-slate-200"}`}>
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-800 rounded-full">
                              {item.qty}
                            </span>
                          </div>
                          <div className="flex gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                            {item.tags.map(t => <span key={t}>{t}</span>)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-medium ${isSelected ? "text-rose-300" : "text-slate-400"}`}>
                            {item.price} <span className="text-[10px]">EGP</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- LIST MODE --- */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                <h3 className="text-xl font-bold text-white mb-1">Shopping List</h3>
                <p className="text-slate-400 text-sm">{stats.finalCost} EGP Est.</p>
             </div>

             <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800/50">
               {includeStaples && (
                 <div className="p-4 flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-amber-500/50 bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <AlertCircle size={12} />
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium">Staples Refill</div>
                      <div className="text-xs text-slate-500">Rice, Oil, Honey, Spices</div>
                    </div>
                 </div>
               )}
               
               {Object.values(selections).map((item) => (
                 <div key={item.id} className="p-4 flex items-start gap-4">
                    <div className="w-5 h-5 mt-1 rounded border border-slate-700 bg-slate-800" />
                    <div>
                      <div className="text-slate-200 font-medium line-through-active">{item.shoppingItem}</div>
                      <div className="text-xs text-emerald-400/80 mt-1">Prep: {item.prep}</div>
                    </div>
                 </div>
               ))}
               
               {!isComplete && (
                  <div className="p-4 text-center text-sm text-slate-500 italic">
                    Finish selecting items to see full list...
                  </div>
               )}
             </div>
          </div>
        )}

        {/* --- FLOATING ACTION BAR --- */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
          <button 
            disabled={!isComplete}
            onClick={() => setViewMode(viewMode === "plan" ? "list" : "plan")}
            className={`w-full h-14 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-2 transition-all
              ${!isComplete 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-rose-600 text-white hover:bg-rose-500 hover:shadow-rose-900/20 hover:scale-[1.02]"
              }`}
          >
            {viewMode === "plan" ? (
              <>
                <ShoppingCart size={20} /> Checkout ({stats.finalCost} EGP)
              </>
            ) : (
              <>
                <ChevronRight size={20} /> Back to Plan
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---
const StatCard = ({ icon, label, value, limit, unit, isCurrency }) => {
  const isDanger = isCurrency ? value > limit : value < limit;
  const colorClass = isDanger ? "text-rose-400" : "text-emerald-400";

  return (
    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center">
      <div className="text-slate-500 mb-1">{icon}</div>
      <div className={`text-lg font-bold leading-none mb-1 ${colorClass}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
};

export default App;