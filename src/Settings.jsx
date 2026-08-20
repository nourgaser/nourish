import React, { useMemo, useState } from 'react';
import { X, Save, Clock, Flame, Leaf, Plus, Trash2, Upload, RotateCcw, Copy, Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_INFO, DEFAULT_CATEGORIES, DEFAULT_PROFILE, DEFAULT_STAPLES, DEFAULT_TARGETS, DEFAULT_PERSONAL } from './data';
import { emptyPer100g, isPriceStale } from './nutrition';

const MACRO_FIELDS = [
  ['kcal', 'Kcal'], ['protein', 'Protein g'], ['fat', 'Fat g'],
  ['satFat', 'Sat Fat g'], ['carbs', 'Carbs g'], ['fiber', 'Fiber g'],
];
const MICRO_FIELDS = [
  ['calcium', 'Calcium mg'], ['iron', 'Iron mg'], ['zinc', 'Zinc mg'],
  ['magnesium', 'Magnesium mg'], ['potassium', 'Potassium mg'], ['folate', 'Folate µg'],
  ['vitA', 'Vit A µg'], ['vitC', 'Vit C mg'], ['vitD', 'Vit D µg'],
  ['b12', 'B12 µg'], ['omega3', 'Omega-3 mg'],
];

const numOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

// Compact per-100g editor reused for catalog items and staples. Blank means
// unknown, never 0 — the app treats a blank field as `null` all the way
// through the aggregation math.
function Per100gEditor({ value, onChange, inputSubtle, labelTone }) {
  const [showMicros, setShowMicros] = useState(false);
  const per100g = value || emptyPer100g();
  const setField = (key, val) => onChange({ ...per100g, [key]: numOrNull(val) });

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {MACRO_FIELDS.map(([key, label]) => (
          <div key={key}>
            <label className={`text-[9px] uppercase font-bold ${labelTone}`}>{label}</label>
            <input
              type="number"
              placeholder="—"
              className={`w-full rounded p-1.5 text-xs ${inputSubtle}`}
              value={per100g[key] ?? ''}
              onChange={(e) => setField(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setShowMicros((s) => !s)}
        className="text-[10px] text-slate-400 hover:text-slate-300 flex items-center gap-1"
      >
        {showMicros ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {showMicros ? 'Hide' : 'Show'} micronutrients (11)
      </button>
      {showMicros && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {MICRO_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label className={`text-[9px] uppercase font-bold ${labelTone}`}>{label}</label>
              <input
                type="number"
                placeholder="—"
                className={`w-full rounded p-1.5 text-xs ${inputSubtle}`}
                value={per100g[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Settings = ({ currentProfile, currentPrices, currentStaples, currentCategories, currentCart, onSave, onClose, onImport, onReset, theme = 'dark', onThemeChange }) => {
  const [profile, setProfile] = useState(currentProfile);
  const [prices, setPrices] = useState(currentPrices);
  const [staples, setStaples] = useState(currentStaples || DEFAULT_STAPLES);
  const [categories, setCategories] = useState(currentCategories || DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'trip' | 'prices' | 'modules' | 'backup'
  const [importText, setImportText] = useState('');
  const [importState, setImportState] = useState(null); // { type: 'error'|'success', message: string }

  const setTarget = (key, field, value) => {
    setProfile((prev) => ({
      ...prev,
      targets: { ...prev.targets, [key]: { ...prev.targets[key], [field]: numOrNull(value) } },
    }));
  };

  const setPersonal = (field, value) => {
    setProfile((prev) => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const handlePriceChange = (id, val) => {
    const num = numOrNull(val);
    setPrices((prev) => {
      const next = { ...prev };
      if (num == null) {
        delete next[id];
      } else {
        next[id] = { value: num, updatedAt: new Date().toISOString() };
      }
      return next;
    });
  };

  const normalizeCategories = (cats) => {
    return cats.map((cat) => ({
      ...cat,
      minSelection: Number(cat.minSelection) || 0,
      items: (cat.items || []).map((item) => ({
        ...item,
        packGrams: numOrNull(item.packGrams),
        edibleFraction: item.edibleFraction === '' || item.edibleFraction == null ? null : Number(item.edibleFraction),
        shelfLifeDays: numOrNull(item.shelfLifeDays),
        effort: numOrNull(item.effort),
        defaultPrice: numOrNull(item.defaultPrice),
        per100g: item.per100g || emptyPer100g(),
      })),
    }));
  };

  const normalizeStaples = (s) => ({
    items: (s.items || []).map((item) => ({
      ...item,
      gramsPerDay: numOrNull(item.gramsPerDay),
      packGrams: numOrNull(item.packGrams),
      defaultPrice: numOrNull(item.defaultPrice),
      per100g: item.per100g || emptyPer100g(),
    })),
  });

  const save = () => {
    onSave(profile, prices, normalizeStaples(staples), normalizeCategories(categories));
    onClose();
  };

  const resetToDefaults = () => {
    setProfile({ ...DEFAULT_PROFILE, name: profile.name || '' });
    setStaples(DEFAULT_STAPLES);
    setCategories(DEFAULT_CATEGORIES);
  };

  const exportJson = useMemo(() => {
    return JSON.stringify({
      version: 2,
      about: APP_INFO,
      profile,
      prices,
      staples,
      categories,
      cart: currentCart,
    }, null, 2);
  }, [profile, prices, staples, categories, currentCart]);

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setImportState({ type: 'success', message: 'Copied to clipboard.' });
    } catch (err) {
      setImportState({ type: 'error', message: 'Copy failed. Select and copy manually.' });
    }
  };

  const handleImport = () => {
    setImportState(null);
    try {
      const parsed = JSON.parse(importText);
      onImport(parsed);
      setProfile(parsed.profile ? { ...DEFAULT_PROFILE, ...parsed.profile } : { ...DEFAULT_PROFILE });
      setPrices(parsed.prices || {});
      setStaples(parsed.staples || DEFAULT_STAPLES);
      setCategories(parsed.categories ? normalizeCategories(parsed.categories) : DEFAULT_CATEGORIES);
      setImportState({ type: 'success', message: 'Settings imported.' });
      setActiveTab('profile');
    } catch (err) {
      setImportState({ type: 'error', message: 'Invalid JSON. Please check and try again.' });
    }
  };

  const updateCategoryField = (catId, field, value) => {
    setCategories(prev => prev.map(cat => cat.id === catId ? { ...cat, [field]: value } : cat));
  };

  const addCategory = () => {
    const timestamp = Date.now();
    setCategories(prev => ([
      ...prev,
      {
        id: `cat_${timestamp}`,
        title: 'New Module',
        description: '',
        notes: '',
        instruction: 'Pick at least 1 for {days} days',
        minSelection: 1,
        items: [],
      }
    ]));
  };

  const removeCategory = (catId) => {
    setCategories(prev => prev.filter(cat => cat.id !== catId));
  };

  const addItem = (catId) => {
    const ts = Date.now();
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: [...(cat.items || []), {
          id: `item_${ts}`,
          name: 'New Item',
          brand: null,
          qty: '1 unit',
          packGrams: null,
          edibleFraction: 1.0,
          divisible: true,
          defaultPrice: null,
          shelfLifeDays: null,
          effort: null,
          slots: [],
          fodmap: null,
          tags: [],
          shoppingItem: 'Describe how to buy',
          prep: 'Prep notes',
          per100g: emptyPer100g(),
        }]
      };
    }));
  };

  const updateItemField = (catId, itemId, field, value) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: (cat.items || []).map(item => item.id === itemId ? { ...item, [field]: value } : item)
      };
    }));
  };

  const removeItem = (catId, itemId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: (cat.items || []).filter(item => item.id !== itemId)
      };
    }));
  };

  const updateStapleField = (stapleId, field, value) => {
    setStaples(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === stapleId ? { ...item, [field]: value } : item),
    }));
  };

  const addStaple = () => {
    const ts = Date.now();
    setStaples(prev => ({
      ...prev,
      items: [...prev.items, { id: `staple_${ts}`, name: 'New Staple', gramsPerDay: null, packGrams: null, defaultPrice: null, per100g: emptyPer100g() }],
    }));
  };

  const removeStaple = (stapleId) => {
    setStaples(prev => ({ ...prev, items: prev.items.filter(item => item.id !== stapleId) }));
  };

  const isDark = theme === 'dark';
  const overlayBg = isDark ? 'bg-slate-950/90' : 'bg-slate-900/10';
  const panel = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const divider = isDark ? 'border-slate-800' : 'border-slate-200';
  const tabIdle = isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700';
  const tabActive = (color) => isDark ? color : color.replace('400', '600');
  const labelTone = isDark ? 'text-slate-500' : 'text-slate-600';
  const inputBase = isDark ? 'bg-slate-950 border border-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-900';
  const inputSubtle = isDark ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-slate-100 border border-slate-200 text-slate-800';
  const cardSoft = isDark ? 'bg-slate-950/70 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700';
  const cardHard = isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-300' : 'text-slate-600';

  const targetGroups = [
    { key: 'kcal', label: 'Calories', fields: [['floor', 'Floor'], ['target', 'Target'], ['ceiling', 'Ceiling']] },
    { key: 'protein', label: 'Protein (g)', fields: [['floor', 'Floor']] },
    { key: 'fat', label: 'Fat (g)', fields: [['hardFloor', 'Hard Floor'], ['floor', 'Floor'], ['ceiling', 'Ceiling']] },
    { key: 'fiber', label: 'Fiber (g)', fields: [['floor', 'Floor'], ['ceiling', 'Ceiling']] },
    { key: 'satFat', label: 'Sat Fat (g)', fields: [['ceiling', 'Ceiling']] },
  ];

  const microTargetKeys = Object.keys(DEFAULT_TARGETS).filter(k => !targetGroups.some(g => g.key === k));

  return (
    <div className={`fixed inset-0 z-50 ${overlayBg} backdrop-blur-sm flex items-start justify-center px-3 py-4 sm:p-6 overflow-y-auto`}>
      <div className={`${panel} w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b ${divider} flex items-center justify-between gap-2`}>
          <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h2>
          <div className="flex items-center gap-2">
            {onThemeChange && (
              <button
                onClick={() => onThemeChange(isDark ? 'light' : 'dark')}
                className={`p-2 rounded-lg border ${isDark ? 'border-slate-700 text-amber-300 hover:bg-slate-800' : 'border-slate-200 text-amber-600 hover:bg-slate-100'}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${divider} overflow-x-auto no-scrollbar px-1 sm:px-0`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-30 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? `${tabActive('text-rose-400')} border-b-2 border-rose-400` : tabIdle}`}
          >
            Profile & Goals
          </button>
          <button
            onClick={() => setActiveTab('trip')}
            className={`flex-1 min-w-30 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'trip' ? `${tabActive('text-amber-400')} border-b-2 border-amber-400` : tabIdle}`}
          >
            Trip & Staples
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex-1 min-w-30 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'prices' ? `${tabActive('text-emerald-400')} border-b-2 border-emerald-400` : tabIdle}`}
          >
            Market Prices
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 min-w-30 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'modules' ? `${tabActive('text-cyan-400')} border-b-2 border-cyan-400` : tabIdle}`}
          >
            Modules
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 min-w-30 px-3 py-3 text-sm font-medium transition-colors ${activeTab === 'backup' ? `${tabActive('text-indigo-400')} border-b-2 border-indigo-400` : tabIdle}`}
          >
            Backup
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {activeTab === 'profile' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Name</label>
                  <input
                    className={`w-full mt-1 rounded-lg p-3 focus:border-rose-500 outline-none ${inputBase}`}
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                  />
                 </div>
                 <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>IBS Mode</label>
                  <button
                    onClick={() => setProfile({...profile, ibsMode: !profile.ibsMode})}
                    className={`w-full mt-1 p-3 rounded-lg border text-left text-sm transition-colors ${profile.ibsMode ? (isDark ? 'bg-rose-500/10 border-rose-500 text-rose-100' : 'bg-rose-50 border-rose-300 text-rose-700') : (isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400')}`}
                  >
                    {profile.ibsMode ? 'Strict (Low FODMAP first)' : 'Normal (show everything)'}
                  </button>
                 </div>
               </div>

               <div>
                <label className={`text-xs font-bold uppercase ${labelTone}`}>Trip Budget (EGP)</label>
                <input
                  type="number"
                  className={`w-full mt-1 rounded-lg p-3 focus:border-rose-500 outline-none ${inputBase}`}
                  value={profile.budgetLimit}
                  onChange={e => setProfile({...profile, budgetLimit: parseFloat(e.target.value) || 0})}
                />
               </div>

               {/* PERSONAL / CONTEXT — nothing here is read by app logic. It
                   exists so this config is self-contained when handed to an
                   LLM or a real dietitian: they can sanity-check the targets
                   below against an actual person instead of numbers alone. */}
               <div className={`${cardHard} p-4 rounded-xl border space-y-3`}>
                 <div>
                   <div className={`font-semibold text-sm ${textPrimary}`}>Personal context</div>
                   <p className={`text-xs ${textSecondary}`}>Not used anywhere in the app's own logic — kept here so an LLM or a dietitian reviewing this config has something to anchor the targets to.</p>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   <div>
                     <label className={`text-[10px] font-bold uppercase ${labelTone}`}>Age</label>
                     <input type="number" className={`w-full mt-1 rounded-lg p-2 text-sm outline-none ${inputSubtle}`} value={profile.personal?.age ?? ''} onChange={e => setPersonal('age', numOrNull(e.target.value))} />
                   </div>
                   <div>
                     <label className={`text-[10px] font-bold uppercase ${labelTone}`}>Sex</label>
                     <input className={`w-full mt-1 rounded-lg p-2 text-sm outline-none ${inputSubtle}`} value={profile.personal?.sex ?? ''} onChange={e => setPersonal('sex', e.target.value)} />
                   </div>
                   <div>
                     <label className={`text-[10px] font-bold uppercase ${labelTone}`}>Height (cm)</label>
                     <input type="number" className={`w-full mt-1 rounded-lg p-2 text-sm outline-none ${inputSubtle}`} value={profile.personal?.heightCm ?? ''} onChange={e => setPersonal('heightCm', numOrNull(e.target.value))} />
                   </div>
                   <div>
                     <label className={`text-[10px] font-bold uppercase ${labelTone}`}>Weight (kg)</label>
                     <input type="number" className={`w-full mt-1 rounded-lg p-2 text-sm outline-none ${inputSubtle}`} value={profile.personal?.weightKg ?? ''} onChange={e => setPersonal('weightKg', numOrNull(e.target.value))} />
                   </div>
                   <div>
                     <label className={`text-[10px] font-bold uppercase ${labelTone}`}>Activity level</label>
                     <input placeholder="e.g. moderate" className={`w-full mt-1 rounded-lg p-2 text-sm outline-none ${inputSubtle}`} value={profile.personal?.activityLevel ?? ''} onChange={e => setPersonal('activityLevel', e.target.value)} />
                   </div>
                   <div>
                     <label className={`text-[10px] font-bold uppercase ${labelTone}`}>Goal</label>
                     <input placeholder="e.g. lean bulk" className={`w-full mt-1 rounded-lg p-2 text-sm outline-none ${inputSubtle}`} value={profile.personal?.goal ?? ''} onChange={e => setPersonal('goal', e.target.value)} />
                   </div>
                 </div>
               </div>

               {/* MACRO + MICRO TARGETS — all of Phase 1.2's targets object,
                   editable here per the spec ("All targets editable in
                   Settings"). */}
               <div className={`${cardHard} p-4 rounded-xl border space-y-4`}>
                 <div className={`font-semibold text-sm ${textPrimary}`}>Daily targets</div>
                 {targetGroups.map(group => (
                   <div key={group.key}>
                     <div className={`text-xs font-bold uppercase mb-1 ${labelTone}`}>{group.label}</div>
                     <div className="grid grid-cols-3 gap-2">
                       {group.fields.map(([field, label]) => (
                         <div key={field}>
                           <label className={`text-[9px] uppercase ${labelTone}`}>{label}</label>
                           <input
                             type="number"
                             className={`w-full mt-0.5 rounded-lg p-2 text-sm outline-none ${inputSubtle}`}
                             value={profile.targets[group.key]?.[field] ?? ''}
                             onChange={e => setTarget(group.key, field, e.target.value)}
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}

                 <div>
                   <div className={`text-xs font-bold uppercase mb-1 ${labelTone}`}>Micronutrient floors</div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {microTargetKeys.map(key => (
                       <div key={key}>
                         <label className={`text-[9px] uppercase ${labelTone}`}>{key}</label>
                         <input
                           type="number"
                           className={`w-full mt-0.5 rounded-lg p-2 text-sm outline-none ${inputSubtle}`}
                           value={profile.targets[key]?.floor ?? ''}
                           onChange={e => setTarget(key, 'floor', e.target.value)}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               <div>
                 <label className={`text-xs font-bold uppercase ${labelTone}`}>Diet notes</label>
                 <p className="text-[10px] mb-1 text-slate-500">Why the targets/modules are shaped this way — not read by the app, just context for whoever (human or LLM) revises this later.</p>
                 <textarea
                   className={`w-full rounded-lg p-3 text-sm outline-none h-28 resize-none ${inputBase}`}
                   value={profile.dietNotes ?? ''}
                   onChange={e => setProfile({...profile, dietNotes: e.target.value})}
                 />
               </div>

               <div className={`pt-4 border-t ${divider}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-rose-500"
                      checked={profile.autoIncludeStaples || false}
                      onChange={e => setProfile({...profile, autoIncludeStaples: e.target.checked})}
                    />
                    <span className={`${textSecondary} font-medium`}>Auto-restock staples budget on each trip</span>
                  </label>
               </div>
            </div>
          )}

          {activeTab === 'trip' && (
            <div className="space-y-5">
              <div className={`${cardHard} p-4 rounded-xl text-sm flex items-start gap-3`}>
                <Leaf size={16} className="text-amber-400 mt-1" />
                <div>
                  <div className={`font-semibold mb-1 ${textPrimary}`}>Staples: a daily rate, not a trip purchase</div>
                  <p className={`text-xs ${textSecondary}`}>
                    Set `Grams/day` to how much of each you actually eat — that's added to your daily
                    macro totals on every trip, restocking or not. `Restock price` only hits the budget
                    on trips where you toggle "restocking staples" on. Per-100g values stay blank until
                    you enter real figures.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {staples.items.map(item => (
                  <div key={item.id} className={`rounded-lg p-3 space-y-2 border ${cardHard}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <input
                        className={`flex-1 rounded p-2 text-sm outline-none ${inputBase}`}
                        value={item.name}
                        onChange={e => updateStapleField(item.id, 'name', e.target.value)}
                      />
                      <div className="w-full sm:w-28">
                        <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Grams/day</label>
                        <input type="number" placeholder="—" className={`w-full rounded p-2 text-sm outline-none ${inputBase}`} value={item.gramsPerDay ?? ''} onChange={e => updateStapleField(item.id, 'gramsPerDay', numOrNull(e.target.value))} />
                      </div>
                      <div className="w-full sm:w-28">
                        <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Pack (g)</label>
                        <input type="number" placeholder="—" className={`w-full rounded p-2 text-sm outline-none ${inputBase}`} value={item.packGrams ?? ''} onChange={e => updateStapleField(item.id, 'packGrams', numOrNull(e.target.value))} />
                      </div>
                      <div className="w-full sm:w-28">
                        <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Restock price</label>
                        <input type="number" placeholder="—" className={`w-full rounded p-2 text-sm outline-none ${inputBase}`} value={item.defaultPrice ?? ''} onChange={e => updateStapleField(item.id, 'defaultPrice', numOrNull(e.target.value))} />
                      </div>
                      <button onClick={() => removeStaple(item.id)} className={`${textSecondary} hover:text-rose-400 transition-colors sm:mt-6`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <Per100gEditor
                      value={item.per100g}
                      onChange={(next) => updateStapleField(item.id, 'per100g', next)}
                      inputSubtle={inputSubtle}
                      labelTone={labelTone}
                    />
                  </div>
                ))}
                <button
                  onClick={addStaple}
                  className={`w-full border border-dashed rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:border-amber-400 ${isDark ? 'border-amber-500/40 text-amber-300 hover:text-amber-200' : 'border-amber-600/30 text-amber-700 hover:text-amber-600'}`}
                >
                  <Plus size={16} /> Add staple
                </button>
              </div>

              <div className={`${cardHard} p-4 rounded-xl text-sm flex items-start gap-3`}>
                <Flame size={16} className="text-rose-400 mt-1" />
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${textPrimary}`}>Trip Length</div>
                      <p className={`text-xs ${textSecondary}`}>Used to average trip-item macros and cost per day. Staples above are already a daily rate and aren't divided by this.</p>
                    </div>
                  </div>
                  <div className="relative w-32">
                    <Clock className="absolute left-3 top-3 text-slate-500" size={14} />
                    <input
                      type="number"
                      step="0.5"
                      className={`w-full rounded-lg p-3 pl-8 focus:border-rose-500 outline-none ${inputBase}`}
                      value={profile.tripDurationDays}
                      onChange={e => setProfile({...profile, tripDurationDays: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={resetToDefaults}
                  className={`flex-1 rounded-xl py-3 transition-colors border ${isDark ? 'border-slate-700 text-slate-200 hover:border-slate-500' : 'border-slate-300 text-slate-700 hover:border-slate-500/80'}`}
                >
                  Reset to Nourish defaults
                </button>
              </div>
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="space-y-6">
              <p className={`text-xs p-3 rounded border ${cardSoft}`}>
                Update prices here. They override each item's catalog default instantly. Leave blank to fall back to the default. Prices older than 60 days will be flagged stale once scraped data lands.
              </p>
              {categories.map(cat => (
                <div key={cat.id}>
                  <h3 className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{cat.title}</h3>
                  <div className="space-y-2">
                    {(cat.items || []).map(item => {
                      const override = prices[item.id];
                      const stale = override?.updatedAt ? isPriceStale(override.updatedAt) : false;
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-2 rounded border ${cardHard}`}>
                          <div>
                            <span className={`text-sm ${textPrimary}`}>{item.name}</span>
                            <div className={`text-[10px] ${textSecondary}`}>
                              default: {item.defaultPrice ?? '—'}
                              {override?.updatedAt && (
                                <span className={stale ? 'text-amber-500' : ''}> · updated {new Date(override.updatedAt).toLocaleDateString()}{stale ? ' (stale)' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="—"
                              className={`w-20 rounded p-1 text-right focus:border-emerald-500 outline-none text-sm ${inputSubtle}`}
                              value={override?.value ?? ''}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            />
                            <span className={`text-xs ${textSecondary}`}>EGP</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-4">
              <p className={`text-xs p-3 rounded border ${cardSoft}`}>
                Configure the modules and items shown in the planner. This overrides the default preset from data.js.
                Per-100g fields stay blank until real nutrition data is entered — blank means unknown, not zero.
              </p>
              {categories.map(cat => (
                <div key={cat.id} className={`rounded-xl p-4 space-y-3 border ${cardSoft}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        className={`w-full rounded-lg p-3 text-sm font-semibold focus:border-cyan-400 outline-none ${inputSubtle}`}
                        value={cat.title}
                        onChange={(e) => updateCategoryField(cat.id, 'title', e.target.value)}
                      />
                      <input
                        className={`w-full rounded-lg p-3 text-xs focus:border-cyan-400 outline-none ${inputSubtle}`}
                        value={cat.instruction || ''}
                        onChange={(e) => updateCategoryField(cat.id, 'instruction', e.target.value)}
                        placeholder="Guidance text — supports a {days} token"
                      />
                      <textarea
                        className={`w-full rounded-lg p-3 text-xs focus:border-cyan-400 outline-none h-16 resize-none ${inputSubtle}`}
                        value={cat.description || ''}
                        onChange={(e) => updateCategoryField(cat.id, 'description', e.target.value)}
                        placeholder="Why this module exists — for a human/LLM reviewer, not shown in the app UI"
                      />
                      <textarea
                        className={`w-full rounded-lg p-3 text-xs focus:border-cyan-400 outline-none h-14 resize-none ${inputSubtle}`}
                        value={cat.notes || ''}
                        onChange={(e) => updateCategoryField(cat.id, 'notes', e.target.value)}
                        placeholder="Extra notes / caveats"
                      />
                      {cat.constraints?.length > 0 && (
                        <div className={`text-[10px] p-2 rounded ${inputSubtle}`}>
                          Constraints (edit via Backup export/import): {cat.constraints.map(c => c.message || `${c.type}:${c.tag}`).join('; ')}
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:w-32">
                      <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Min</label>
                      <input
                        type="number"
                        className={`w-full rounded-lg p-2 text-sm focus:border-cyan-400 outline-none ${inputSubtle}`}
                        value={cat.minSelection}
                        onChange={(e) => updateCategoryField(cat.id, 'minSelection', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button onClick={() => removeCategory(cat.id)} className={`${textSecondary} hover:text-rose-400 transition-colors sm:mt-1`}>
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(cat.items || []).map(item => (
                      <div key={item.id} className={`rounded-lg p-3 space-y-2 border ${cardHard}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="flex-1 space-y-2">
                            <input
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.name}
                              onChange={(e) => updateItemField(cat.id, item.id, 'name', e.target.value)}
                            />
                            <input
                              className={`w-full rounded p-2 text-xs focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.qty}
                              onChange={(e) => updateItemField(cat.id, item.id, 'qty', e.target.value)}
                              placeholder="Human-readable pack label, e.g. 1 kg"
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Price</label>
                            <input
                              type="number"
                              placeholder="—"
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.defaultPrice ?? ''}
                              onChange={(e) => updateItemField(cat.id, item.id, 'defaultPrice', numOrNull(e.target.value))}
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Pack (g)</label>
                            <input
                              type="number"
                              placeholder="—"
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.packGrams ?? ''}
                              onChange={(e) => updateItemField(cat.id, item.id, 'packGrams', numOrNull(e.target.value))}
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Edible %</label>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.edibleFraction ?? ''}
                              onChange={(e) => updateItemField(cat.id, item.id, 'edibleFraction', numOrNull(e.target.value))}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1 sm:mt-5">
                            <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Divisible</label>
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-cyan-500"
                              checked={item.divisible !== false}
                              onChange={(e) => updateItemField(cat.id, item.id, 'divisible', e.target.checked)}
                            />
                          </div>
                          <button onClick={() => removeItem(cat.id, item.id)} className={`${textSecondary} hover:text-rose-400 transition-colors sm:mt-6`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <input
                            className={`w-full rounded p-2 focus:border-cyan-400 outline-none ${inputBase}`}
                            value={item.shoppingItem || ''}
                            onChange={(e) => updateItemField(cat.id, item.id, 'shoppingItem', e.target.value)}
                            placeholder="Shopping list label"
                          />
                          <input
                            className={`w-full rounded p-2 focus:border-cyan-400 outline-none ${inputBase}`}
                            value={item.prep || ''}
                            onChange={(e) => updateItemField(cat.id, item.id, 'prep', e.target.value)}
                            placeholder="Prep notes"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Shelf life (days)</label>
                            <input type="number" placeholder="—" className={`w-full rounded p-2 outline-none ${inputSubtle}`} value={item.shelfLifeDays ?? ''} onChange={(e) => updateItemField(cat.id, item.id, 'shelfLifeDays', numOrNull(e.target.value))} />
                          </div>
                          <div>
                            <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Effort (1-3)</label>
                            <input type="number" min="1" max="3" placeholder="—" className={`w-full rounded p-2 outline-none ${inputSubtle}`} value={item.effort ?? ''} onChange={(e) => updateItemField(cat.id, item.id, 'effort', numOrNull(e.target.value))} />
                          </div>
                          <div>
                            <label className={`text-[9px] uppercase font-bold ${labelTone}`}>FODMAP</label>
                            <select className={`w-full rounded p-2 outline-none ${inputSubtle}`} value={item.fodmap ?? ''} onChange={(e) => updateItemField(cat.id, item.id, 'fodmap', e.target.value || null)}>
                              <option value="">—</option>
                              <option value="low">low</option>
                              <option value="moderate">moderate</option>
                              <option value="high">high</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Slots</label>
                            <input
                              className={`w-full rounded p-2 outline-none ${inputSubtle}`}
                              value={(item.slots || []).join(', ')}
                              onChange={(e) => updateItemField(cat.id, item.id, 'slots', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="breakfast, lunch"
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`text-[9px] uppercase font-bold ${labelTone}`}>Tags (comma-separated, also used for module constraints like "omega-3")</label>
                          <input
                            className={`w-full rounded p-2 text-xs outline-none ${inputSubtle}`}
                            value={(item.tags || []).join(', ')}
                            onChange={(e) => updateItemField(cat.id, item.id, 'tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          />
                        </div>
                        {Array.isArray(item.parts) && item.parts.length > 0 ? (
                          <div className={`text-[10px] p-2 rounded ${inputSubtle}`}>
                            This is a compound pack ({item.parts.map(p => p.label).join(' + ')}) — its per-component nutrition is edited via Backup export/import for now, not this form.
                          </div>
                        ) : (
                          <Per100gEditor
                            value={item.per100g}
                            onChange={(next) => updateItemField(cat.id, item.id, 'per100g', next)}
                            inputSubtle={inputSubtle}
                            labelTone={labelTone}
                          />
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => addItem(cat.id)}
                      className={`w-full border border-dashed rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:border-cyan-400 ${isDark ? 'border-cyan-500/40 text-cyan-300 hover:text-cyan-200' : 'border-cyan-600/30 text-cyan-700 hover:text-cyan-600'}`}
                    >
                      <Plus size={16} /> Add item
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addCategory}
                className={`w-full border border-dashed rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:border-cyan-400 ${isDark ? 'border-cyan-500/40 text-cyan-300 hover:text-cyan-200' : 'border-cyan-600/30 text-cyan-700 hover:text-cyan-600'}`}
              >
                <Plus size={18} /> Add category
              </button>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 space-y-3 border ${cardSoft}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-semibold ${textPrimary}`}>Export all settings</h3>
                    <p className={`text-xs ${textSecondary}`}>Profile (incl. personal context & targets), prices, staples, modules, cart — self-describing, safe to hand to an LLM or a dietitian.</p>
                  </div>
                  <button onClick={copyExport} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isDark ? 'bg-slate-900 border border-slate-800 text-slate-100 hover:border-indigo-400' : 'bg-white border border-slate-200 text-slate-800 hover:border-indigo-300'}`}>
                    <Copy size={14} /> Copy
                  </button>
                </div>
                <textarea
                  value={exportJson}
                  readOnly
                  className={`w-full h-48 rounded-lg p-3 text-xs font-mono resize-none ${inputSubtle}`}
                />
              </div>

              <div className={`rounded-xl p-4 space-y-3 border ${cardSoft}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-semibold ${textPrimary}`}>Import settings</h3>
                    <p className={`text-xs ${textSecondary}`}>Paste JSON to overwrite everything.</p>
                  </div>
                  <button onClick={handleImport} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isDark ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                    <Upload size={14} /> Import
                  </button>
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported JSON here"
                  className={`w-full h-40 rounded-lg p-3 text-xs font-mono focus:border-indigo-400 outline-none ${inputSubtle}`}
                />
              </div>

              <div className={`${isDark ? 'bg-rose-500/5 border border-rose-500/40' : 'bg-rose-50 border border-rose-200'} rounded-xl p-4 flex items-center justify-between`}>
                <div>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-rose-100' : 'text-rose-700'}`}>Reset to defaults</h3>
                  <p className={`text-xs ${isDark ? 'text-rose-200/80' : 'text-rose-600'}`}>Clears local data and reloads defaults.</p>
                </div>
                <button onClick={() => { if (window.confirm('Reset all settings to defaults?')) onReset(); }} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isDark ? 'border border-rose-400 text-rose-100 hover:bg-rose-500/10' : 'border border-rose-300 text-rose-700 hover:bg-rose-100'}`}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              {importState && (
                <div className={`text-xs font-semibold px-3 py-2 rounded border ${importState.type === 'success' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/40' : 'text-rose-300 bg-rose-500/10 border-rose-500/40'}`}>
                  {importState.message}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${divider}`}>
          <button
            onClick={save}
            className={`w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};
