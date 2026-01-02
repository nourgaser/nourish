import React, { useMemo, useState, useEffect } from "react";
import { 
  Activity, ShoppingBag, Wallet, Minus, Plus, 
  RefreshCw, ChevronRight, AlertCircle, ShoppingCart, Trash2, CheckCircle2, XCircle
} from "lucide-react";
import { APP_CONFIG, CATEGORIES, STAPLES_COST, STAPLES_CALORIES, STAPLES_PROTEIN } from "./data";
import { Logo } from "./Logo";

const App = () => {
  // --- STATE ---
  const [cart, setCart] = useState({});
  const [includeStaples, setIncludeStaples] = useState(false);
  const [viewMode, setViewMode] = useState("plan"); 

  useEffect(() => {
    const saved = localStorage.getItem("nourish_cart_v3");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("nourish_cart_v3", JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev, [itemId]: next };
      if (next === 0) delete newCart[itemId];
      return newCart;
    });
  };

  const resetPlan = () => {
    if(confirm("Clear your cart?")) {
      setCart({});
      setViewMode("plan");
    }
  };

  // --- CALCULATIONS ---
  const stats = useMemo(() => {
    let tripCost = 0;
    let tripCals = 0;
    let tripProtein = 0;
    let totalItems = 0;
    const categoryCounts = {};

    // Initialize counts
    CATEGORIES.forEach(c => categoryCounts[c.id] = 0);

    CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        const qty = cart[item.id] || 0;
        if (qty > 0) {
          tripCost += item.price * qty;
          tripCals += item.calories * qty;
          tripProtein += item.protein * qty;
          totalItems += qty;
          categoryCounts[cat.id] += qty;
        }
      });
    });

    const finalCost = includeStaples ? tripCost + STAPLES_COST : tripCost;
    const dailyCals = (tripCals / APP_CONFIG.tripDurationDays) + STAPLES_CALORIES;
    const dailyProtein = (tripProtein / APP_CONFIG.tripDurationDays) + STAPLES_PROTEIN;

    return { finalCost, dailyCals, dailyProtein, totalItems, categoryCounts };
  }, [cart, includeStaples]);

  // --- SMART ADVISOR LOGIC ---
  const getSmartAdvice = () => {
    if (stats.finalCost > APP_CONFIG.budgetLimit + (includeStaples ? STAPLES_COST : 0)) {
      return { type: 'error', text: `Over budget by ${stats.finalCost - (APP_CONFIG.budgetLimit + (includeStaples ? STAPLES_COST : 0))} EGP. Remove an item.` };
    }
    
    // Check Category Minimums
    for (const cat of CATEGORIES) {
      if (stats.categoryCounts[cat.id] < cat.minSelection) {
        return { type: 'warn', text: `Add ${cat.minSelection - stats.categoryCounts[cat.id]} more item(s) to ${cat.title}.` };
      }
    }

    // Check Macros
    if (stats.dailyCals < APP_CONFIG.targetDailyCalories - 200) {
      return { type: 'warn', text: `Low Calories (${Math.round(stats.dailyCals)}). Add Bananas or more Protein.` };
    }

    if (stats.dailyProtein < APP_CONFIG.targetDailyProtein - 10) {
      return { type: 'warn', text: `Low Protein. Add Eggs or Yogurt.` };
    }

    return { type: 'success', text: "Plan looks perfect! You're ready." };
  };

  const advice = getSmartAdvice();
  const isPlanValid = advice.type === 'success' || advice.type === 'warn'; // Allow warnings, block errors? Or block warnings too? 
  // Let's block 'warn' from checking out easily to enforce habits, but user can override if they really want.
  const canCheckout = advice.type !== 'error';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 pb-32 sm:max-w-xl">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
              <Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">NOURISH</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">GA SER'S KITCHEN</p>
            </div>
          </div>
          <button onClick={resetPlan} className="p-2 text-slate-500 hover:text-rose-400">
            <RefreshCw size={18} />
          </button>
        </header>

        {/* SMART ADVISOR BANNER */}
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 transition-colors duration-300
          ${advice.type === 'error' ? 'bg-rose-500/10 border-rose-500/50 text-rose-200' : 
            advice.type === 'warn' ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 
            'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'}`}>
           {advice.type === 'error' ? <XCircle className="shrink-0 mt-0.5" size={18} /> : 
            advice.type === 'warn' ? <AlertCircle className="shrink-0 mt-0.5" size={18} /> : 
            <CheckCircle2 className="shrink-0 mt-0.5" size={18} />}
           <div className="text-sm font-medium leading-tight">{advice.text}</div>
        </div>

        {/* STATS */}
        <section className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={<Wallet size={16} />} label="Cost" value={stats.finalCost} limit={APP_CONFIG.budgetLimit} unit="EGP" isCurrency />
          <StatCard icon={<Activity size={16} />} label="Cals" value={Math.round(stats.dailyCals)} limit={APP_CONFIG.targetDailyCalories} unit="" />
          <StatCard icon={<ShoppingBag size={16} />} label="Prot" value={Math.round(stats.dailyProtein)} limit={APP_CONFIG.targetDailyProtein} unit="g" />
        </section>

        {/* STAPLES */}
        <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${includeStaples ? 'bg-amber-400' : 'bg-slate-700'}`} />
            <span className="text-sm text-slate-300">Refill Staples? <span className="text-xs text-slate-500">(Rice/Oil/Honey)</span></span>
          </div>
          <button onClick={() => setIncludeStaples(!includeStaples)} className={`w-10 h-6 flex items-center rounded-full px-1 transition-colors ${includeStaples ? 'bg-amber-500' : 'bg-slate-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${includeStaples ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {viewMode === "plan" ? (
          <div className="flex flex-col gap-8 animate-in fade-in">
            {CATEGORIES.map((cat) => {
              const currentCount = stats.categoryCounts[cat.id];
              const isSatisfied = currentCount >= cat.minSelection;

              return (
                <div key={cat.id} className={`space-y-3 transition-opacity ${isSatisfied ? 'opacity-100' : 'opacity-100'}`}>
                  
                  {/* Category Header with Validation Check */}
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h2 className={`text-xs font-bold uppercase tracking-widest ${isSatisfied ? "text-emerald-400" : "text-slate-500"}`}>
                        {cat.title}
                      </h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">{cat.instruction}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-mono border ${isSatisfied ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                      {currentCount} / {cat.minSelection}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {cat.items.map((item) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${qty > 0 ? "bg-slate-900 border-rose-500/30 shadow-sm" : "bg-slate-950/50 border-slate-800/60"}`}>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center justify-between mb-1">
                               <div className={`font-semibold text-sm ${qty > 0 ? "text-slate-100" : "text-slate-400"}`}>{item.name}</div>
                               <div className="text-xs font-mono text-slate-500">{item.price}</div>
                            </div>
                            <div className="flex gap-2 text-[10px] text-slate-500 uppercase">
                              <span className="bg-slate-900 px-1.5 rounded text-slate-400">{item.qty}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-3 rounded-xl p-1 ${qty > 0 ? 'bg-slate-800' : 'bg-slate-900 border border-slate-800'}`}>
                            <button onClick={() => updateQuantity(item.id, -1)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${qty > 0 ? 'hover:bg-slate-700 text-slate-300' : 'text-slate-700 pointer-events-none'}`}>
                              {qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                            </button>
                            <div className={`w-4 text-center font-bold text-sm ${qty > 0 ? "text-rose-400" : "text-slate-600"}`}>{qty}</div>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><Plus size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST MODE */
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
             <div className="bg-slate-900/50 p-6 rounded-2xl border border-rose-500/20 text-center shadow-lg">
                <h3 className="text-xl font-bold text-white mb-1">Shopping List</h3>
                <p className="text-rose-300 font-mono text-lg">{stats.finalCost} EGP <span className="text-slate-500 text-sm">approx</span></p>
             </div>
             <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800/50">
               {includeStaples && (
                 <div className="p-4 flex items-center gap-3 bg-amber-500/5">
                    <AlertCircle size={16} className="text-amber-500" />
                    <div>
                      <div className="text-slate-200 font-medium text-sm">Refill Staples</div>
                      <div className="text-xs text-slate-500">Rice, Oil, Honey, Spices</div>
                    </div>
                 </div>
               )}
               {CATEGORIES.flatMap(c => c.items).filter(i => cart[i.id] > 0).map((item) => (
                 <div key={item.id} className="p-4 flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-500 border border-rose-500/20">{cart[item.id]}x</div>
                    <div>
                      <div className="text-slate-200 font-medium text-sm">{item.shoppingItem}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.prep}</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50">
          <button 
            disabled={!canCheckout}
            onClick={() => setViewMode(viewMode === "plan" ? "list" : "plan")}
            className={`w-full h-14 rounded-2xl font-bold text-base shadow-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95
              ${!canCheckout 
                ? "bg-slate-800 text-slate-500 opacity-80" 
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/40"
              }`}
          >
            {viewMode === "plan" ? (
              <>
                <ShoppingCart size={18} /> Review List ({stats.totalItems})
              </>
            ) : (
              <>
                <ChevronRight size={18} /> Adjust Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, limit, unit, isCurrency }) => {
  let colorClass = "text-slate-400";
  if (isCurrency) {
    colorClass = value > limit ? "text-rose-400" : "text-emerald-400";
  } else {
    const ratio = value / limit;
    if (ratio >= 0.95) colorClass = "text-emerald-400";
    else if (ratio >= 0.75) colorClass = "text-amber-400";
    else colorClass = "text-rose-400";
  }
  return (
    <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/60 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="text-slate-500 mb-1.5 opacity-80">{icon}</div>
      <div className={`text-lg font-bold leading-none mb-1 ${colorClass}`}>{value}</div>
      <div className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
};

export default App;