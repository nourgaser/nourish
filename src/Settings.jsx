import React, { useMemo, useState } from 'react';
import { X, Save, Clock, Flame, Leaf, Plus, Trash2, Upload, RotateCcw, Copy, Sun, Moon } from 'lucide-react';
import { DEFAULT_CATEGORIES, DEFAULT_CONFIG, STAPLES } from './data';

export const Settings = ({ currentProfile, currentPrices, currentStaples, currentCategories, currentCart, onSave, onClose, onImport, onReset, theme = 'dark', onThemeChange }) => {
  const [profile, setProfile] = useState(currentProfile);
  const [prices, setPrices] = useState(currentPrices);
  const [staples, setStaples] = useState(currentStaples || STAPLES);
  const [categories, setCategories] = useState(currentCategories || DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'trip' | 'prices' | 'modules' | 'backup'
  const [importText, setImportText] = useState('');
  const [importState, setImportState] = useState(null); // { type: 'error'|'success', message: string }

  const handlePriceChange = (id, val) => {
    setPrices(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const normalizeCategories = (cats) => {
    return cats.map(cat => ({
      ...cat,
      minSelection: Number(cat.minSelection) || 0,
      items: (cat.items || []).map(item => ({
        ...item,
        defaultPrice: Number(item.defaultPrice) || 0,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
      }))
    }));
  };

  const save = () => {
    const normalizedCats = normalizeCategories(categories);
    onSave(profile, prices, staples, normalizedCats);
    onClose();
  };

  const resetToDefaults = () => {
    setProfile({ ...DEFAULT_CONFIG, name: profile.name || '', autoIncludeStaples: false });
    setStaples(STAPLES);
    setCategories(DEFAULT_CATEGORIES);
  };

  const exportJson = useMemo(() => {
    return JSON.stringify({
      version: 1,
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
      setProfile(parsed.profile || { ...DEFAULT_CONFIG, name: '' });
      setPrices(parsed.prices || {});
      setStaples(parsed.staples || STAPLES);
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
      { id: `cat_${timestamp}`, title: 'New Module', instruction: 'Describe the goal for this bucket', minSelection: 1, items: [] }
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
          qty: '1 unit',
          defaultPrice: 0,
          calories: 0,
          protein: 0,
          shoppingItem: 'Describe how to buy',
          prep: 'Prep notes'
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
            <div className="space-y-4">
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

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Daily Cals</label>
                  <input 
                    type="number"
                    className={`w-full mt-1 rounded-lg p-3 focus:border-rose-500 outline-none ${inputBase}`}
                    value={profile.targetDailyCalories}
                    onChange={e => setProfile({...profile, targetDailyCalories: parseFloat(e.target.value) || 0})}
                  />
                 </div>
                 <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Daily Prot</label>
                  <input 
                    type="number"
                    className={`w-full mt-1 rounded-lg p-3 focus:border-rose-500 outline-none ${inputBase}`}
                    value={profile.targetDailyProtein}
                    onChange={e => setProfile({...profile, targetDailyProtein: parseFloat(e.target.value) || 0})}
                  />
                 </div>
                 <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Trip Days</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-500" size={14} />
                    <input 
                      type="number"
                      step="0.5"
                      className={`w-full mt-1 rounded-lg p-3 pl-8 focus:border-rose-500 outline-none ${inputBase}`}
                      value={profile.tripDurationDays}
                      onChange={e => setProfile({...profile, tripDurationDays: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                 </div>
               </div>

               <div>
                <label className={`text-xs font-bold uppercase ${labelTone}`}>Trip Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 text-sm">EGP</span>
                  <input 
                    type="number"
                    className={`w-full mt-1 rounded-lg p-3 pl-12 focus:border-rose-500 outline-none ${inputBase}`}
                    value={profile.budgetLimit}
                    onChange={e => setProfile({...profile, budgetLimit: parseFloat(e.target.value) || 0})}
                  />
                </div>
               </div>

               <div className={`pt-4 border-t ${divider}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded accent-rose-500"
                      checked={profile.autoIncludeStaples || false}
                      onChange={e => setProfile({...profile, autoIncludeStaples: e.target.checked})}
                    />
                    <span className={`${textSecondary} font-medium`}>Auto-include Staples on each trip</span>
                  </label>
               </div>
            </div>
          )}

          {activeTab === 'trip' && (
            <div className="space-y-5">
              <div className={`${cardHard} p-4 rounded-xl text-sm flex items-start gap-3`}>
                <Leaf size={16} className="text-amber-400 mt-1" />
                <div>
                  <div className={`font-semibold mb-1 ${textPrimary}`}>Staples buffer (Rice / Oil / Honey)</div>
                  <p className={`text-xs ${textSecondary}`}>These calories/cost get injected into every plan to keep the math honest.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Staples Cost (EGP)</label>
                  <input
                    type="number"
                    className={`w-full mt-1 rounded-lg p-3 focus:border-amber-500 outline-none ${inputBase}`}
                    value={staples.cost}
                    onChange={e => setStaples({ ...staples, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Staples Calories</label>
                  <input
                    type="number"
                    className={`w-full mt-1 rounded-lg p-3 focus:border-amber-500 outline-none ${inputBase}`}
                    value={staples.calories}
                    onChange={e => setStaples({ ...staples, calories: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase ${labelTone}`}>Staples Protein</label>
                  <input
                    type="number"
                    className={`w-full mt-1 rounded-lg p-3 focus:border-amber-500 outline-none ${inputBase}`}
                    value={staples.protein}
                    onChange={e => setStaples({ ...staples, protein: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className={`${cardHard} p-4 rounded-xl text-sm flex items-start gap-3`}>
                <Flame size={16} className="text-rose-400 mt-1" />
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${textPrimary}`}>Trip Length</div>
                      <p className={`text-xs ${textSecondary}`}>Used to average macros and cost per day.</p>
                    </div>
                    <div className={`text-sm font-semibold ${textSecondary}`}>{profile.tripDurationDays} days</div>
                  </div>
                  <div className={`grid grid-cols-3 gap-2 text-xs ${textSecondary}`}>
                    <span className={`${inputSubtle} rounded px-2 py-1`}>Cost includes staples: {profile.autoIncludeStaples ? 'Yes' : 'No'}</span>
                    <span className={`${inputSubtle} rounded px-2 py-1`}>Avg Cals/day: recalculated</span>
                    <span className={`${inputSubtle} rounded px-2 py-1`}>Avg Prot/day: recalculated</span>
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
                Update prices here. They will override the defaults instantly.
              </p>
              {categories.map(cat => (
                <div key={cat.id}>
                  <h3 className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{cat.title}</h3>
                  <div className="space-y-2">
                    {(cat.items || []).map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-2 rounded border ${cardHard}`}>
                        <span className={`text-sm ${textPrimary}`}>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className={`w-20 rounded p-1 text-right focus:border-emerald-500 outline-none text-sm ${inputSubtle}`}
                            value={prices[item.id] ?? item.defaultPrice}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          />
                          <span className={`text-xs ${textSecondary}`}>EGP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-4">
              <p className={`text-xs p-3 rounded border ${cardSoft}`}>
                Configure the modules and items shown in the planner. This overrides the default preset from data.js.
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
                        placeholder="Guidance text"
                      />
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
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Price</label>
                            <input
                              type="number"
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.defaultPrice}
                              onChange={(e) => updateItemField(cat.id, item.id, 'defaultPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Cals</label>
                            <input
                              type="number"
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.calories}
                              onChange={(e) => updateItemField(cat.id, item.id, 'calories', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className={`text-[10px] uppercase font-bold ${labelTone}`}>Prot</label>
                            <input
                              type="number"
                              className={`w-full rounded p-2 text-sm focus:border-cyan-400 outline-none ${inputBase}`}
                              value={item.protein}
                              onChange={(e) => updateItemField(cat.id, item.id, 'protein', parseFloat(e.target.value) || 0)}
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
                    <p className={`text-xs ${textSecondary}`}>Profile, prices, staples, modules, cart.</p>
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