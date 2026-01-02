import React, { useMemo, useState, useEffect } from "react";
import {
  Activity, ShoppingBag, Wallet, Minus, Plus,
  RefreshCw, ChevronRight, AlertCircle, ShoppingCart, Trash2, CheckCircle2, XCircle,
  Settings as SettingsIcon, Sun, Moon
} from "lucide-react";
import { DEFAULT_CATEGORIES, DEFAULT_CONFIG, STAPLES } from "./data";
import { Logo } from "./Logo";
import { Onboarding } from "./Onboarding";
import { Settings } from "./Settings";

function mergeProfileDefaults(profile) {
  const normalized = profile || {};
  const {
    name = "",
    budgetLimit = DEFAULT_CONFIG.budgetLimit,
    targetDailyCalories = DEFAULT_CONFIG.targetDailyCalories,
    targetDailyProtein = DEFAULT_CONFIG.targetDailyProtein,
    tripDurationDays = DEFAULT_CONFIG.tripDurationDays,
    ibsMode = DEFAULT_CONFIG.ibsMode,
    autoIncludeStaples = false,
    ...rest
  } = normalized;

  return {
    name,
    ibsMode,
    autoIncludeStaples,
    budgetLimit: Number(budgetLimit),
    targetDailyCalories: Number(targetDailyCalories),
    targetDailyProtein: Number(targetDailyProtein),
    tripDurationDays: Number(tripDurationDays),
    ...rest,
  };
}

const App = () => {
  // --- GLOBAL STATE ---
  const [userProfile, setUserProfile] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [staplesConfig, setStaplesConfig] = useState(STAPLES);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [cart, setCart] = useState({});
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("nourish_theme");
    const initial = (saved === "light" || saved === "dark")
      ? saved
      : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = initial;
    return initial;
  });
  
  // --- UI STATE ---
  const [includeStaples, setIncludeStaples] = useState(false);
  const [viewMode, setViewMode] = useState("plan"); 
  const [showSettings, setShowSettings] = useState(false);

  // Prevent background scroll when overlays are open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (showSettings) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showSettings]);

  // --- PERSISTENCE ---
  useEffect(() => {
    // Load all data on mount
    const savedProfile = localStorage.getItem("nourish_profile");
    const savedPrices = localStorage.getItem("nourish_prices");
    const savedCart = localStorage.getItem("nourish_cart_v3");
    const savedStaples = localStorage.getItem("nourish_staples_v1");
    const savedCategories = localStorage.getItem("nourish_categories_v1");

    if (savedProfile) setUserProfile(mergeProfileDefaults(JSON.parse(savedProfile)));
    if (savedPrices) setPriceOverrides(JSON.parse(savedPrices));
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedStaples) setStaplesConfig(JSON.parse(savedStaples));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
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

  useEffect(() => {
    localStorage.setItem("nourish_categories_v1", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nourish_theme", theme);
  }, [theme]);

  useEffect(() => {
    const validIds = new Set(categories.flatMap(cat => (cat.items || []).map(item => item.id)));
    setCart(prev => {
      const next = {};
      Object.entries(prev).forEach(([id, qty]) => {
        if (validIds.has(id)) next[id] = qty;
      });
      return next;
    });
    setPriceOverrides(prev => {
      const next = {};
      Object.entries(prev).forEach(([id, price]) => {
        if (validIds.has(id)) next[id] = price;
      });
      return next;
    });
  }, [categories]);


  // --- HANDLERS ---
  const handleOnboardingComplete = (data) => {
    const normalized = mergeProfileDefaults(data);
    setUserProfile(normalized);
    setIncludeStaples(normalized.autoIncludeStaples ?? false);
  };

  const handleSettingsSave = (newProfile, newPrices, newStaples, newCategories) => {
    const normalizedProfile = mergeProfileDefaults(newProfile);
    const nextCategories = newCategories?.length ? newCategories : DEFAULT_CATEGORIES;
    const validIds = new Set(nextCategories.flatMap(cat => (cat.items || []).map(item => item.id)));

    const cleanedCart = Object.fromEntries(Object.entries(cart).filter(([id]) => validIds.has(id)));
    const cleanedPrices = Object.fromEntries(Object.entries(newPrices || {}).filter(([id]) => validIds.has(id)));

    setUserProfile(normalizedProfile);
    setPriceOverrides(cleanedPrices);
    setStaplesConfig(newStaples);
    setCategories(nextCategories);
    setCart(cleanedCart);
    setIncludeStaples(normalizedProfile.autoIncludeStaples ?? false);
  };

  const applyImportedSettings = (data) => {
    const normalizedProfile = mergeProfileDefaults(data?.profile || {});
    const nextCategories = data?.categories?.length ? data.categories : DEFAULT_CATEGORIES;
    const staples = data?.staples || STAPLES;

    const validIds = new Set(nextCategories.flatMap(cat => (cat.items || []).map(item => item.id)));
    const cleanedPrices = Object.fromEntries(Object.entries(data?.prices || {}).filter(([id]) => validIds.has(id)));
    const cleanedCart = Object.fromEntries(Object.entries(data?.cart || {}).filter(([id]) => validIds.has(id)));

    setUserProfile(normalizedProfile);
    setPriceOverrides(cleanedPrices);
    setStaplesConfig(staples);
    setCategories(nextCategories);
    setCart(cleanedCart);
    setIncludeStaples(normalizedProfile.autoIncludeStaples ?? false);
    setViewMode("plan");
  };

  const resetAll = () => {
    const defaultProfile = mergeProfileDefaults({});
    setUserProfile(defaultProfile);
    setPriceOverrides({});
    setStaplesConfig(STAPLES);
    setCategories(DEFAULT_CATEGORIES);
    setCart({});
    setIncludeStaples(defaultProfile.autoIncludeStaples ?? false);
    setViewMode("plan");
    setTheme("dark");
    localStorage.removeItem("nourish_profile");
    localStorage.removeItem("nourish_prices");
    localStorage.removeItem("nourish_cart_v3");
    localStorage.removeItem("nourish_staples_v1");
    localStorage.removeItem("nourish_categories_v1");
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

  const setQuantity = (itemId, value) => {
    setCart(prev => {
      const next = Math.max(0, isNaN(value) ? 0 : value);
      const newCart = { ...prev, [itemId]: next };
      if (next === 0) delete newCart[itemId];
      return newCart;
    });
  };

  const handleCardTap = (event, itemId) => {
    const el = event.currentTarget;
    const point = event.touches?.[0] || event;
    const rect = el.getBoundingClientRect();
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    el.style.setProperty("--ripple-x", `${x}px`);
    el.style.setProperty("--ripple-y", `${y}px`);
    el.classList.remove("ripple-active");
    // Force reflow so ripple can restart
    void el.offsetWidth;
    requestAnimationFrame(() => el.classList.add("ripple-active"));
    setTimeout(() => el.classList.remove("ripple-active"), 500);
    updateQuantity(itemId, 1);
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

    categories.forEach(c => categoryCounts[c.id] = 0);

    categories.forEach(cat => {
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
  }, [cart, includeStaples, userProfile, priceOverrides, staplesConfig, categories]);


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
    for (const cat of categories) {
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
  const bannerTone = (tone) => {
    if (tone === 'error') return theme === "dark" ? "bg-rose-500/10 border-rose-500/50 text-rose-200" : "bg-rose-50 border-rose-200 text-rose-800";
    if (tone === 'warn') return theme === "dark" ? "bg-amber-500/10 border-amber-500/50 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800";
    return theme === "dark" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-200" : "bg-emerald-50 border-emerald-200 text-emerald-800";
  };

  const surfaceCard = theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const surfaceMuted = theme === "dark" ? "bg-slate-900/40 border-slate-800/50" : "bg-slate-100 border-slate-200";
  const chipMuted = theme === "dark" ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600";
  const textSubtle = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const textMuted = "text-slate-500";
  const panelStrong = theme === "dark" ? "bg-slate-950/50 border-slate-800/60" : "bg-slate-50 border-slate-200";

  return (
    <div className={`min-h-screen font-sans selection:bg-rose-500/25 ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {showSettings && (
        <Settings 
          currentProfile={userProfile} 
          currentPrices={priceOverrides} 
          currentStaples={staplesConfig}
          currentCategories={categories}
          currentCart={cart}
          onSave={handleSettingsSave}
          onImport={applyImportedSettings}
          onReset={resetAll}
          onClose={() => setShowSettings(false)}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 pb-32 sm:max-w-xl">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border shadow-xl ${surfaceCard}`}>
              <Logo />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>NOURISH</h1>
              <p className={`text-xs font-medium tracking-wide uppercase ${textSubtle}`}>{userProfile.name}'S KITCHEN</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className={`p-2 transition-colors ${theme === "dark" ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
              <SettingsIcon size={20} />
            </button>
            <button onClick={resetPlan} className={`p-2 transition-colors ${theme === "dark" ? "text-slate-500 hover:text-rose-400" : "text-slate-500 hover:text-rose-500"}`}>
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-lg border transition-colors ${theme === "dark" ? "text-amber-300 border-slate-800 hover:bg-slate-900" : "text-amber-600 border-slate-200 hover:bg-slate-100"}`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* SMART ADVISOR BANNER */}
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 transition-colors duration-300 ${bannerTone(advice.type)}`}>
           {advice.type === 'error' ? <XCircle className="shrink-0 mt-0.5" size={18} /> : 
            advice.type === 'warn' ? <AlertCircle className="shrink-0 mt-0.5" size={18} /> : 
            <CheckCircle2 className="shrink-0 mt-0.5" size={18} />}
           <div className="text-sm font-medium leading-tight">{advice.text}</div>
        </div>

        {/* STATS */}
        <section className="grid grid-cols-3 gap-3 mb-6">
          <StatCard theme={theme} icon={<Wallet size={16} />} label="Cost" value={stats.finalCost} limit={userProfile.budgetLimit} unit="EGP" isCurrency />
          <StatCard theme={theme} icon={<Activity size={16} />} label="Cals" value={Math.round(stats.dailyCals)} limit={userProfile.targetDailyCalories} unit="" />
          <StatCard theme={theme} icon={<ShoppingBag size={16} />} label="Prot" value={Math.round(stats.dailyProtein)} limit={userProfile.targetDailyProtein} unit="g" />
        </section>

        {/* STAPLES TOGGLE */}
        <div className={`flex items-center justify-between p-3 rounded-xl mb-6 ${surfaceMuted}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${includeStaples ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>Refill Staples? <span className={`text-xs ${textMuted}`}>(Rice/Oil/Honey)</span></span>
          </div>
          <button onClick={() => setIncludeStaples(!includeStaples)} className={`w-10 h-6 flex items-center rounded-full px-1 transition-colors ${includeStaples ? 'bg-amber-500' : theme === "dark" ? 'bg-slate-700' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${includeStaples ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        {viewMode === "plan" ? (
          <div className="flex flex-col gap-8 animate-in fade-in">
            {categories.map((cat) => {
              const currentCount = stats.categoryCounts[cat.id];
              const isSatisfied = currentCount >= cat.minSelection;

              return (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h2 className={`text-xs font-bold uppercase tracking-widest ${isSatisfied ? "text-emerald-500" : textSubtle}`}>
                        {cat.title}
                      </h2>
                      <p className={`text-[10px] mt-0.5 ${textMuted}`}>{cat.instruction}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-mono border ${isSatisfied ? (theme === "dark" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600") : (theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500")}`}>
                      {currentCount} / {cat.minSelection}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {cat.items.map((item) => {
                      const qty = cart[item.id] || 0;
                      const price = getPrice(item.id, item.defaultPrice);
                      
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div 
                              onClick={(e) => handleCardTap(e, item.id)}
                              className={`flex-1 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ripple-card ${qty > 0 ? (theme === "dark" ? "bg-slate-900 border-rose-500/30 shadow-sm" : "bg-rose-50 border-rose-200 shadow-sm") : panelStrong}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className={`font-semibold text-sm ${qty > 0 ? (theme === "dark" ? "text-slate-100" : "text-slate-900") : textSubtle}`}>{item.name}</div>
                                <div className={`text-xs font-mono ${textMuted}`}>{price}</div>
                              </div>
                              <div className={`flex gap-2 text-[10px] uppercase ${textMuted}`}>
                                <span className={`px-1.5 rounded ${chipMuted}`}>{item.qty}</span>
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 rounded-xl p-1 ${qty > 0 ? (theme === "dark" ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200') : (theme === "dark" ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200')}`}>
                              <button onClick={() => updateQuantity(item.id, -1)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${qty > 0 ? (theme === "dark" ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700') : 'text-slate-400 pointer-events-none'}`}>
                                {qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                              </button>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={qty}
                                onChange={(e) => setQuantity(item.id, parseFloat(e.target.value))}
                                className={`w-16 text-center text-sm font-semibold rounded-lg border focus:border-rose-500 focus:outline-none py-1 ${theme === "dark" ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} ${qty > 0 ? 'border-rose-500/50' : ''}`}
                              />
                              <button onClick={() => updateQuantity(item.id, 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${theme === "dark" ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-900 text-slate-100 hover:bg-slate-800'}`}><Plus size={14} /></button>
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
             <div className={`${theme === "dark" ? "bg-slate-900/50 border-rose-500/20" : "bg-rose-50 border-rose-200"} p-6 rounded-2xl border text-center shadow-lg`}>
                <h3 className={`text-xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Shopping List</h3>
                <p className={`font-mono text-lg ${theme === "dark" ? "text-rose-300" : "text-rose-600"}`}>{stats.finalCost} EGP <span className={`${textMuted} text-sm`}>approx</span></p>
             </div>
             <div className={`${theme === "dark" ? "bg-slate-900 border-slate-800 divide-slate-800/50" : "bg-white border-slate-200 divide-slate-200/70"} rounded-2xl border divide-y`}>
               {includeStaples && (
                 <div className={`${theme === "dark" ? "bg-amber-500/5" : "bg-amber-50"} p-4 flex items-center gap-3`}>
                    <AlertCircle size={16} className={theme === "dark" ? "text-amber-500" : "text-amber-600"} />
                    <div>
                      <div className={`font-medium text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>Refill Staples</div>
                      <div className={`text-xs ${textMuted}`}>Rice, Oil, Honey, Spices ({staplesConfig.cost} EGP)</div>
                    </div>
                 </div>
               )}
               {categories.flatMap(c => c.items).filter(i => cart[i.id] > 0).map((item) => (
                 <div key={item.id} className="p-4 flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-500 border border-rose-500/20">{cart[item.id]}x</div>
                    <div>
                      <div className={`font-medium text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{item.shoppingItem}</div>
                      <div className={`text-xs mt-0.5 ${textMuted}`}>{item.prep}</div>
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
                ? (theme === "dark" ? "bg-slate-800 text-slate-500 opacity-80" : "bg-slate-200 text-slate-500 opacity-80")
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
const StatCard = ({ icon, label, value, limit, unit, isCurrency, theme = "dark" }) => {
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
    <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center shadow-sm ${theme === "dark" ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200"}`}>
      <div className="text-slate-500 mb-1.5 opacity-80">{icon}</div>
      <div className={`text-lg font-bold leading-none mb-1 ${colorClass}`}>{value}</div>
      <div className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
};

export default App;