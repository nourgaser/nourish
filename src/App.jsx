import React, { useMemo, useState, useEffect } from "react";
import {
  Wallet, Minus, Plus, Flag, Clock,
  RefreshCw, ChevronRight, ChevronDown, ChevronUp, AlertCircle, Info, ShoppingCart, Trash2, CheckCircle2, XCircle,
  Settings as SettingsIcon, Sun, Moon
} from "lucide-react";
import { DEFAULT_CATEGORIES, DEFAULT_PROFILE, DEFAULT_STAPLES, DEFAULT_TARGETS, DEFAULT_PERSONAL } from "./data";
import {
  NUTRIENT_KEYS,
  aggregateNutrients,
  aggregateCost,
  staplesDailyNutrients,
  staplesRestockCost,
  resolvePrice,
  interpolateInstruction,
  valuePerCurrency,
  isPriceStale,
} from "./nutrition";
import { evaluateBasket, canCheckout as advisorCanCheckout, MICRO_KEYS, MICRO_TARGET_RATIO } from "./advisor";
import { Logo } from "./Logo";
import { Onboarding } from "./Onboarding";
import { Settings } from "./Settings";

function mergeTargets(targets) {
  const merged = {};
  Object.keys(DEFAULT_TARGETS).forEach((key) => {
    merged[key] = { ...DEFAULT_TARGETS[key], ...(targets?.[key] || {}) };
  });
  return merged;
}

// Biometric/context fields the app itself never reads (see DEFAULT_PERSONAL
// in data.js) — still normalized like everything else so a partial import
// doesn't drop fields an LLM/dietitian round-trip added.
function mergePersonal(personal) {
  return { ...DEFAULT_PERSONAL, ...(personal || {}) };
}

// Reads and parses a localStorage key, returning null on absence or
// corruption. Used only inside lazy useState initializers below — loading
// persisted state synchronously at that point (rather than via a mount
// effect) avoids a real race: an effect that loads state and separate
// per-key effects that save it will, on the very first render, run with
// the pre-load closure and overwrite the just-loaded value with the
// initial default. React 18 StrictMode's dev-only double-invoke of effects
// turns that race into a guaranteed data loss on every reload.
function readLocalStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeProfileDefaults(profile) {
  const normalized = profile || {};
  const {
    name = "",
    budgetLimit = DEFAULT_PROFILE.budgetLimit,
    tripDurationDays = DEFAULT_PROFILE.tripDurationDays,
    ibsMode = DEFAULT_PROFILE.ibsMode,
    autoIncludeStaples = DEFAULT_PROFILE.autoIncludeStaples,
    targets,
    personal,
    dietNotes = DEFAULT_PROFILE.dietNotes,
    ...rest
  } = normalized;

  return {
    name,
    ibsMode,
    autoIncludeStaples,
    budgetLimit: Number(budgetLimit),
    tripDurationDays: Number(tripDurationDays),
    targets: mergeTargets(targets),
    personal: mergePersonal(personal),
    dietNotes,
    ...rest,
  };
}

const App = () => {
  // --- GLOBAL STATE ---
  // Loaded synchronously from localStorage on first render (see
  // readLocalStorage above) rather than via a mount effect + setState.
  const [userProfile, setUserProfile] = useState(() => {
    const saved = readLocalStorage("nourish_profile_v2");
    return saved ? mergeProfileDefaults(saved) : null;
  });
  const [priceOverrides, setPriceOverrides] = useState(() => readLocalStorage("nourish_prices_v2") || {});
  const [staplesConfig, setStaplesConfig] = useState(() => readLocalStorage("nourish_staples_v2") || DEFAULT_STAPLES);
  const [categories, setCategories] = useState(() => readLocalStorage("nourish_categories_v2") || DEFAULT_CATEGORIES);
  const [cart, setCart] = useState(() => readLocalStorage("nourish_cart_v3") || {});
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
  const [includeStaples, setIncludeStaples] = useState(() => userProfile?.autoIncludeStaples ?? false);
  const [viewMode, setViewMode] = useState("plan");
  const [showSettings, setShowSettings] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [showMicroDetail, setShowMicroDetail] = useState(false);

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
  // Key names carry a _v2 suffix because the value shapes changed (prices
  // gained {value, updatedAt}; staples became a daily-rate item list;
  // profile targets became a nested object) — this is just so any leftover
  // dev-testing data in this browser's localStorage doesn't get loaded into
  // the new shape and crash the app, not a migration system.
  //
  // Loading happens synchronously in the useState initializers above, not
  // here — a separate mount-effect-that-loads plus these per-key
  // effects-that-save used to race (the save effects' first run captures
  // the pre-load default and overwrites whatever was just loaded), which
  // React 18 StrictMode's dev-only double-invoke of effects turned into a
  // guaranteed data loss on every reload. cart/priceOverrides staying
  // consistent with categories is handled at the point categories actually
  // change (handleSettingsSave / applyImportedSettings below), not via a
  // separate reconciliation effect.
  useEffect(() => {
    if (userProfile) localStorage.setItem("nourish_profile_v2", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("nourish_prices_v2", JSON.stringify(priceOverrides));
  }, [priceOverrides]);

  useEffect(() => {
    localStorage.setItem("nourish_cart_v3", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("nourish_staples_v2", JSON.stringify(staplesConfig));
  }, [staplesConfig]);

  useEffect(() => {
    localStorage.setItem("nourish_categories_v2", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nourish_theme", theme);
  }, [theme]);

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
    const staples = data?.staples || DEFAULT_STAPLES;

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
    setStaplesConfig(DEFAULT_STAPLES);
    setCategories(DEFAULT_CATEGORIES);
    setCart({});
    setIncludeStaples(defaultProfile.autoIncludeStaples ?? false);
    setViewMode("plan");
    setTheme("dark");
    localStorage.removeItem("nourish_profile_v2");
    localStorage.removeItem("nourish_prices_v2");
    localStorage.removeItem("nourish_cart_v3");
    localStorage.removeItem("nourish_staples_v2");
    localStorage.removeItem("nourish_categories_v2");
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

  // --- CALCULATIONS ---
  const stats = useMemo(() => {
    if (!userProfile) return null;

    const entries = [];
    // Distinct items with qty > 0, per module — what minSelection counts against.
    const categoryCounts = {};
    // Raw quantity totals, kept separately for any UI that wants them.
    const categoryQuantities = {};
    let totalItems = 0;

    categories.forEach(c => { categoryCounts[c.id] = 0; categoryQuantities[c.id] = 0; });

    categories.forEach(cat => {
      cat.items.forEach(item => {
        const qty = cart[item.id] || 0;
        if (qty > 0) {
          entries.push({ item, qty });
          totalItems += qty;
          categoryCounts[cat.id] += 1;
          categoryQuantities[cat.id] += qty;
        }
      });
    });

    const tripNutrients = aggregateNutrients(entries);
    const tripCostResult = aggregateCost(entries, priceOverrides);

    const staples = staplesConfig || DEFAULT_STAPLES;
    // Staples nutrition is a daily consumption baseline (you eat rice/oil
    // most days of the trip regardless of whether you're restocking today),
    // so it's always included and never divided by trip duration — see
    // nutrition.js `staplesDailyNutrients`. Only the restock *cost* is
    // trip-scoped and gated by the includeStaples toggle.
    const staplesDaily = staplesDailyNutrients(staples);
    const restockCost = includeStaples
      ? staplesRestockCost(staples, priceOverrides)
      : { value: 0, complete: true };

    const tripDuration = Math.max(1, userProfile.tripDurationDays || DEFAULT_PROFILE.tripDurationDays);

    const dailyNutrients = {};
    NUTRIENT_KEYS.forEach((key) => {
      const trip = tripNutrients[key];
      const daily = staplesDaily[key];
      dailyNutrients[key] = {
        value: trip.value / tripDuration + daily.value,
        complete: trip.complete && daily.complete,
      };
    });

    const finalCost = tripCostResult.value + restockCost.value;
    const costComplete = tripCostResult.complete && restockCost.complete;

    return { finalCost, costComplete, dailyNutrients, totalItems, categoryCounts, categoryQuantities, entries };
  }, [cart, includeStaples, userProfile, priceOverrides, staplesConfig, categories]);


  // --- EARLY RETURN: ONBOARDING ---
  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // --- ADVISOR LOGIC ---
  // Restock cost is added to both spend and the limit here — deliberate,
  // existing behavior: staples restocking is treated as a separate,
  // always-affordable pantry expense outside the discretionary trip budget.
  // Net effect: toggling it on doesn't change whether the trip itself is
  // judged over budget.
  const staples = staplesConfig || DEFAULT_STAPLES;
  const restockCostValue = includeStaples ? staplesRestockCost(staples, priceOverrides).value : 0;

  const findings = evaluateBasket({
    entries: stats.entries,
    categories,
    categoryCounts: stats.categoryCounts,
    dailyNutrients: stats.dailyNutrients,
    targets: userProfile.targets,
    tripDurationDays: userProfile.tripDurationDays,
    finalCost: stats.finalCost,
    costComplete: stats.costComplete,
    budgetLimit: userProfile.budgetLimit + restockCostValue,
    budgetGrace: 50,
  });
  const canCheckout = advisorCanCheckout(findings);
  const [topFinding, ...restFindings] = findings;
  const advice = topFinding || { severity: 'success', message: "Plan looks solid. Ready to shop." };

  const bannerTone = (severity) => {
    if (severity === 'error') return theme === "dark" ? "bg-rose-500/10 border-rose-500/50 text-rose-200" : "bg-rose-50 border-rose-200 text-rose-800";
    if (severity === 'warn') return theme === "dark" ? "bg-amber-500/10 border-amber-500/50 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800";
    if (severity === 'info') return theme === "dark" ? "bg-sky-500/10 border-sky-500/50 text-sky-200" : "bg-sky-50 border-sky-200 text-sky-800";
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

        {/* SMART ADVISOR BANNER — shows the highest-severity finding; the
            rest (never more than a single collapsed row) expand on tap. */}
        <div className={`mb-6 rounded-xl border transition-colors duration-300 ${bannerTone(advice.severity)}`}>
          <div className="p-4 flex items-start gap-3">
             {advice.severity === 'error' ? <XCircle className="shrink-0 mt-0.5" size={18} /> :
              advice.severity === 'warn' ? <AlertCircle className="shrink-0 mt-0.5" size={18} /> :
              advice.severity === 'info' ? <Info className="shrink-0 mt-0.5" size={18} /> :
              <CheckCircle2 className="shrink-0 mt-0.5" size={18} />}
             <div className="text-sm font-medium leading-tight">{advice.message}</div>
          </div>
          {restFindings.length > 0 && (
            <div className="px-4 pb-3">
              <button
                onClick={() => setShowAllFindings(s => !s)}
                className="text-xs font-semibold underline decoration-dotted flex items-center gap-1 opacity-80 hover:opacity-100"
              >
                {showAllFindings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAllFindings ? "Hide" : `+${restFindings.length} more`}
              </button>
              {showAllFindings && (
                <ul className="mt-2 space-y-1.5">
                  {restFindings.map((f, i) => (
                    <li key={f.code + i} className="text-xs leading-snug flex items-start gap-1.5">
                      <span className="opacity-60">
                        {f.severity === 'error' ? <XCircle size={12} /> : f.severity === 'warn' ? <AlertCircle size={12} /> : <Info size={12} />}
                      </span>
                      {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* COST */}
        <div className={`flex items-center justify-between p-3 rounded-xl border mb-3 ${surfaceCard}`}>
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-slate-500" />
            <span className={`text-xs font-medium uppercase tracking-widest ${textMuted}`}>Cost</span>
          </div>
          <div className={`text-base font-bold ${!stats.costComplete ? "text-slate-500" : stats.finalCost > userProfile.budgetLimit ? "text-rose-400" : "text-emerald-400"}`}>
            {stats.costComplete ? `${Math.round(stats.finalCost)} EGP` : "—"}
            <span className={`text-xs font-normal ml-1 ${textMuted}`}>/ {userProfile.budgetLimit}</span>
          </div>
        </div>

        {/* NUTRIENT PANEL — kcal/protein/fat/carbs/fiber as primary, plus a
            single collapsed Micros tile (n/11 on target) that expands into
            per-nutrient coverage bars. Colored by distance from floor. */}
        <section className={`grid grid-cols-3 gap-2 ${showMicroDetail ? "mb-3" : "mb-6"}`}>
          {[
            { key: "kcal", label: "Kcal", unit: "" },
            { key: "protein", label: "Protein", unit: "g" },
            { key: "fat", label: "Fat", unit: "g" },
            { key: "carbs", label: "Carbs", unit: "g" },
            { key: "fiber", label: "Fiber", unit: "g" },
          ].map(({ key, label, unit }) => {
            const daily = stats.dailyNutrients[key];
            const target = userProfile.targets[key] || {};
            return (
              <MacroTile
                key={key} theme={theme} label={label} unit={unit}
                value={daily.value} complete={daily.complete}
                floor={target.floor} ceiling={target.ceiling}
              />
            );
          })}
          <MicroTile
            theme={theme}
            dailyNutrients={stats.dailyNutrients}
            targets={userProfile.targets}
            expanded={showMicroDetail}
            onToggle={() => setShowMicroDetail(s => !s)}
          />
        </section>

        {showMicroDetail && (
          <div className={`mb-6 p-3 rounded-xl border space-y-2 ${panelStrong}`}>
            {MICRO_KEYS.map((key) => {
              const daily = stats.dailyNutrients[key];
              const floor = userProfile.targets[key]?.floor;
              const pct = daily.complete && floor ? Math.min(100, (daily.value / floor) * 100) : 0;
              const barColor = !daily.complete
                ? "bg-slate-600"
                : pct >= 100 ? "bg-emerald-500" : pct >= MICRO_TARGET_RATIO * 100 ? "bg-amber-500" : "bg-rose-500";
              return (
                <div key={key} className="flex items-center gap-2 text-[10px]">
                  <span className={`w-20 uppercase ${textMuted}`}>{key}</span>
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                    <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`w-10 text-right ${textMuted}`}>{daily.complete ? Math.round(daily.value) : "—"}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* STAPLES TOGGLE */}
        <div className={`flex items-center justify-between p-3 rounded-xl mb-6 ${surfaceMuted}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${includeStaples ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
              Restocking staples this trip? <span className={`text-xs ${textMuted}`}>(Rice/Oil/Honey — cost only; the daily macros above always include them)</span>
            </span>
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
                      <p className={`text-[10px] mt-0.5 ${textMuted}`}>{interpolateInstruction(cat.instruction, userProfile.tripDurationDays)}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-mono border ${isSatisfied ? (theme === "dark" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600") : (theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500")}`}>
                      {currentCount} / {cat.minSelection}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* ibsMode sorts high-FODMAP items to the bottom of each
                        module (stable sort — doesn't otherwise reorder) but
                        never hides them; tolerance is individual. */}
                    {(userProfile.ibsMode
                      ? [...cat.items].sort((a, b) => (a.fodmap === 'high' ? 1 : 0) - (b.fodmap === 'high' ? 1 : 0))
                      : cat.items
                    ).map((item) => {
                      const qty = cart[item.id] || 0;
                      const price = resolvePrice(item, priceOverrides);
                      const override = priceOverrides[item.id];
                      const priceStale = override?.updatedAt ? isPriceStale(override.updatedAt) : false;
                      const isDeemphasized = userProfile.ibsMode && item.fodmap === 'high';

                      const single = aggregateNutrients([{ item, qty: 1 }]);
                      const unitKcal = valuePerCurrency(single.kcal.complete ? single.kcal.value : null, price);
                      const unitProtein = valuePerCurrency(single.protein.complete ? single.protein.value : null, price);

                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div
                              onClick={(e) => handleCardTap(e, item.id)}
                              title={isDeemphasized ? (item.prep ? `High FODMAP — ${item.prep}` : "High FODMAP") : undefined}
                              className={`flex-1 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ripple-card ${isDeemphasized ? 'opacity-60' : ''} ${qty > 0 ? (theme === "dark" ? "bg-slate-900 border-rose-500/30 shadow-sm" : "bg-rose-50 border-rose-200 shadow-sm") : panelStrong}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isDeemphasized && <Flag size={11} className="text-amber-500 shrink-0" />}
                                  <div className={`font-semibold text-sm truncate ${qty > 0 ? (theme === "dark" ? "text-slate-100" : "text-slate-900") : textSubtle}`}>{item.name}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {priceStale && <Clock size={10} className="text-amber-500" title={`Price last updated ${new Date(override.updatedAt).toLocaleDateString()} — may be stale`} />}
                                  <div className={`text-xs font-mono ${textMuted}`}>{price == null ? "—" : Math.round(price)}</div>
                                </div>
                              </div>
                              <div className={`flex flex-wrap gap-1 text-[10px] uppercase mb-1 ${textMuted}`}>
                                <span className={`px-1.5 rounded ${chipMuted}`}>{item.qty}</span>
                                {(item.tags || []).map((tag) => (
                                  <span key={tag} className={`px-1.5 rounded ${theme === "dark" ? "bg-slate-800/70 text-slate-500" : "bg-slate-200/70 text-slate-500"}`}>{tag}</span>
                                ))}
                              </div>
                              <div className={`text-[10px] ${textMuted}`}>
                                {unitKcal != null ? `${unitKcal.toFixed(1)} kcal/EGP` : "—"} · {unitProtein != null ? `${unitProtein.toFixed(1)}g protein/EGP` : "—"}
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 rounded-xl p-1 ${qty > 0 ? (theme === "dark" ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200') : (theme === "dark" ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200')}`}>
                              <button onClick={() => updateQuantity(item.id, -1)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${qty > 0 ? (theme === "dark" ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700') : 'text-slate-400 pointer-events-none'}`}>
                                {qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                              </button>
                              <input
                                type="number"
                                step={item.divisible === false ? "1" : "0.1"}
                                min="0"
                                value={qty}
                                onChange={(e) => {
                                  const raw = parseFloat(e.target.value);
                                  setQuantity(item.id, item.divisible === false ? Math.round(raw) : raw);
                                }}
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
                <p className={`font-mono text-lg ${theme === "dark" ? "text-rose-300" : "text-rose-600"}`}>{stats.costComplete ? `${Math.round(stats.finalCost)} EGP` : "— EGP"} <span className={`${textMuted} text-sm`}>approx</span></p>
             </div>
             <div className={`${theme === "dark" ? "bg-slate-900 border-slate-800 divide-slate-800/50" : "bg-white border-slate-200 divide-slate-200/70"} rounded-2xl border divide-y`}>
               {includeStaples && (
                 <div className={`${theme === "dark" ? "bg-amber-500/5" : "bg-amber-50"} p-4 flex items-center gap-3`}>
                    <AlertCircle size={16} className={theme === "dark" ? "text-amber-500" : "text-amber-600"} />
                    <div>
                      <div className={`font-medium text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>Restock Staples</div>
                      {(() => {
                        const restock = staplesRestockCost(staplesConfig, priceOverrides);
                        return (
                          <div className={`text-xs ${textMuted}`}>
                            Rice, Oil, Honey, Spices ({restock.complete ? `${Math.round(restock.value)} EGP` : "price unknown"})
                          </div>
                        );
                      })()}
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

// Colors a macro tile by distance from its floor/ceiling — unknown stays
// neutral rather than reading as a failure, over-ceiling reads as amber
// (a warn per the advisor, not an error), and a macro with no target at
// all (carbs) never gets judged, just displayed.
function macroColorClass(complete, value, floor, ceiling, theme) {
  if (!complete) return "text-slate-500";
  if (ceiling != null && value > ceiling) return "text-amber-400";
  if (floor != null) {
    const ratio = floor > 0 ? value / floor : 1;
    if (ratio < 0.7) return "text-rose-400";
    if (ratio < 1) return "text-amber-400";
    return "text-emerald-400";
  }
  return theme === "dark" ? "text-slate-300" : "text-slate-600";
}

const tileSurface = (theme) => (theme === "dark" ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200");

const MacroTile = ({ theme, label, value, complete, floor, ceiling, unit }) => {
  const color = macroColorClass(complete, value, floor, ceiling, theme);
  return (
    <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${tileSurface(theme)}`}>
      <div className={`text-sm font-bold leading-none mb-1 ${color}`}>{complete ? `${Math.round(value)}${unit}` : "—"}</div>
      <div className="text-[8px] text-slate-500 font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
};

const MicroTile = ({ theme, dailyNutrients, targets, expanded, onToggle }) => {
  const known = MICRO_KEYS.filter((k) => dailyNutrients[k].complete);
  const onTarget = known.filter((k) => {
    const floor = targets[k]?.floor;
    return floor != null && dailyNutrients[k].value >= floor * MICRO_TARGET_RATIO;
  });
  const color = known.length === 0
    ? "text-slate-500"
    : onTarget.length === MICRO_KEYS.length ? "text-emerald-400" : onTarget.length >= 8 ? "text-amber-400" : "text-rose-400";
  return (
    <button
      onClick={onToggle}
      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm transition-colors ${tileSurface(theme)} ${theme === "dark" ? "hover:border-slate-700" : "hover:border-slate-300"}`}
    >
      <div className={`text-sm font-bold leading-none mb-1 ${color}`}>{onTarget.length}/{MICRO_KEYS.length}</div>
      <div className="text-[8px] text-slate-500 font-medium uppercase tracking-widest flex items-center gap-0.5">
        Micros {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
      </div>
    </button>
  );
};

export default App;
