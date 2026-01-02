import React, { useMemo, useState, useEffect } from "react";
import { 
  Activity, ShoppingBag, Wallet, Minus, Plus, 
  RefreshCw, ChevronRight, AlertCircle, ShoppingCart, Trash2, CheckCircle2, XCircle, Settings as SettingsIcon
} from "lucide-react";
import { CATEGORIES, DEFAULT_CONFIG, STAPLES } from "./data";
import { Logo } from "./Logo";
import { Onboarding } from "./Onboarding";
import { Settings } from "./Settings";

function mergeProfileDefaults(profile) {
  const normalized = profile || {};
  return {
    name: "",
    budgetLimit: DEFAULT_CONFIG.budgetLimit,
    targetDailyCalories: DEFAULT_CONFIG.targetDailyCalories,
    targetDailyProtein: DEFAULT_CONFIG.targetDailyProtein,
    tripDurationDays: DEFAULT_CONFIG.tripDurationDays,
    ibsMode: DEFAULT_CONFIG.ibsMode,
    autoIncludeStaples: false,
    ...normalized,
    budgetLimit: Number(normalized.budgetLimit ?? DEFAULT_CONFIG.budgetLimit),
    targetDailyCalories: Number(normalized.targetDailyCalories ?? DEFAULT_CONFIG.targetDailyCalories),
    targetDailyProtein: Number(normalized.targetDailyProtein ?? DEFAULT_CONFIG.targetDailyProtein),
    tripDurationDays: Number(normalized.tripDurationDays ?? DEFAULT_CONFIG.tripDurationDays),
  };
}

const App = () => {
  // --- GLOBAL STATE ---
  const [userProfile, setUserProfile] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [staplesConfig, setStaplesConfig] = useState(STAPLES);
  const [cart, setCart] = useState({});
  
  // --- UI STATE ---
  const [includeStaples, setIncludeStaples] = useState(false);
  const [viewMode, setViewMode] = useState("plan"); 
  const [showSettings, setShowSettings] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    // Load all data on mount
    const savedProfile = localStorage.getItem("nourish_profile");
    const savedPrices = localStorage.getItem("nourish_prices");
    const savedCart = localStorage.getItem("nourish_cart_v3");
    const savedStaples = localStorage.getItem("nourish_staples_v1");

    if (savedProfile) setUserProfile(mergeProfileDefaults(JSON.parse(savedProfile)));
    if (savedPrices) setPriceOverrides(JSON.parse(savedPrices));
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedStaples) setStaplesConfig(JSON.parse(savedStaples));
  }, []);

  // Save on change
  useEffect(() => {
    if (userProfile) localStorage.setItem("nourish_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("nourish_prices", JSON.stringify(priceOverrides));
  }, [priceOverrides]);

  useEffect(() => {
    localStorage.setItem("nourish_cart_v3", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("nourish_staples_v1", JSON.stringify(staplesConfig));
  }, [staplesConfig]);


  // --- HANDLERS ---
  const handleOnboardingComplete = (data) => {
    const normalized = mergeProfileDefaults(data);
    setUserProfile(normalized);
    setIncludeStaples(normalized.autoIncludeStaples ?? false);
  };

  const handleSettingsSave = (newProfile, newPrices, newStaples) => {
    const normalizedProfile = mergeProfileDefaults(newProfile);
    setUserProfile(normalizedProfile);
    setPriceOverrides(newPrices);
    setStaplesConfig(newStaples);
    setIncludeStaples(normalizedProfile.autoIncludeStaples ?? false);
  };

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

  // --- HELPER: Get Price ---
  const getPrice = (itemId, defaultPrice) => {
    return priceOverrides[itemId] !== undefined ? priceOverrides[itemId] : defaultPrice;
  };

  // --- CALCULATIONS ---
  useEffect(() => {
    if (userProfile?.autoIncludeStaples !== undefined) {
      setIncludeStaples(userProfile.autoIncludeStaples);
    }
  }, [userProfile]);

  const stats = useMemo(() => {
    if (!userProfile) return null;

    let tripCost = 0;
    let tripCals = 0;
    let tripProtein = 0;
    let totalItems = 0;
    const categoryCounts = {};

    CATEGORIES.forEach(c => categoryCounts[c.id] = 0);

    CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        const qty = cart[item.id] || 0;
        if (qty > 0) {
          const currentPrice = getPrice(item.id, item.defaultPrice);
          tripCost += currentPrice * qty;
          tripCals += item.calories * qty;
          tripProtein += item.protein * qty;
          totalItems += qty;
          categoryCounts[cat.id] += qty;
        }
      });
    });

    const staples = staplesConfig || STAPLES;
    const tripDuration = Math.max(1, userProfile.tripDurationDays || DEFAULT_CONFIG.tripDurationDays);
    const finalCost = includeStaples ? tripCost + staples.cost : tripCost;
    const dailyCals = (tripCals / tripDuration) + staples.calories;
    const dailyProtein = (tripProtein / tripDuration) + staples.protein;

    return { finalCost, dailyCals, dailyProtein, totalItems, categoryCounts };
  }, [cart, includeStaples, userProfile, priceOverrides, staplesConfig]);


  // --- EARLY RETURN: ONBOARDING ---
  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // --- ADVISOR LOGIC ---
  const getSmartAdvice = () => {
    const staples = staplesConfig || STAPLES;
    const budgetLimit = userProfile.budgetLimit + (includeStaples ? staples.cost : 0);
    const budgetGrace = 50;
    const overBudget = stats.finalCost - budgetLimit;
    
    if (overBudget > budgetGrace) {
      return { type: 'error', text: `Over budget by ${overBudget} EGP. (Max buffer ${budgetGrace})` };
    }
    if (overBudget > 0) {
      return { type: 'warn', text: `Over budget by ${overBudget} EGP but within the ${budgetGrace} EGP buffer.` };
    }
    
    // Category Mins
    for (const cat of CATEGORIES) {
      if (stats.categoryCounts[cat.id] < cat.minSelection) {
        return { type: 'warn', text: `Add ${cat.minSelection - stats.categoryCounts[cat.id]} more item(s) to ${cat.title}.` };
      }
    }

    // Macros
    if (stats.dailyCals < userProfile.targetDailyCalories - 200) {
      return { type: 'warn', text: `Low Calories (${Math.round(stats.dailyCals)}). Goal: ${userProfile.targetDailyCalories}.` };
    }
    if (stats.dailyProtein < userProfile.targetDailyProtein - 10) {
      return { type: 'warn', text: `Low Protein. Goal: ${userProfile.targetDailyProtein}g.` };
    }

    return { type: 'success', text: "Plan looks solid. Ready to shop." };
  };

  const advice = getSmartAdvice();
  const canCheckout = advice.type !== 'error';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30">
      
      {showSettings && (
        <Settings 
          currentProfile={userProfile} 
          currentPrices={priceOverrides} 
          currentStaples={staplesConfig}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 pb-32 sm:max-w-xl">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
              <Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">NOURISH</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{userProfile.name}'S KITCHEN</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-white transition-colors">
              <SettingsIcon size={20} />
            </button>
            <button onClick={resetPlan} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
              <RefreshCw size={20} />
            </button>
          </div>
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
          <StatCard icon={<Wallet size={16} />} label="Cost" value={stats.finalCost} limit={userProfile.budgetLimit} unit="EGP" isCurrency />
          <StatCard icon={<Activity size={16} />} label="Cals" value={Math.round(stats.dailyCals)} limit={userProfile.targetDailyCalories} unit="" />
          <StatCard icon={<ShoppingBag size={16} />} label="Prot" value={Math.round(stats.dailyProtein)} limit={userProfile.targetDailyProtein} unit="g" />
        </section>

        {/* STAPLES TOGGLE */}
        <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${includeStaples ? 'bg-amber-400' : 'bg-slate-700'}`} />
            <span className="text-sm text-slate-300">Refill Staples? <span className="text-xs text-slate-500">(Rice/Oil/Honey)</span></span>
          </div>
          <button onClick={() => setIncludeStaples(!includeStaples)} className={`w-10 h-6 flex items-center rounded-full px-1 transition-colors ${includeStaples ? 'bg-amber-500' : 'bg-slate-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${includeStaples ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        {viewMode === "plan" ? (
          <div className="flex flex-col gap-8 animate-in fade-in">
            {CATEGORIES.map((cat) => {
              const currentCount = stats.categoryCounts[cat.id];
              const isSatisfied = currentCount >= cat.minSelection;

              return (
                <div key={cat.id} className="space-y-3">
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
                      const price = getPrice(item.id, item.defaultPrice);
                      
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${qty > 0 ? "bg-slate-900 border-rose-500/30 shadow-sm" : "bg-slate-950/50 border-slate-800/60"}`}>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center justify-between mb-1">
                               <div className={`font-semibold text-sm ${qty > 0 ? "text-slate-100" : "text-slate-400"}`}>{item.name}</div>
                               <div className="text-xs font-mono text-slate-500">{price}</div>
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
                      <div className="text-xs text-slate-500">Rice, Oil, Honey, Spices ({staplesConfig.cost} EGP)</div>
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

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40">
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

// Sub-components kept same as previous (StatCard, Logo, etc.)
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