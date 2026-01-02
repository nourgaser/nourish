import React, { useMemo, useState } from 'react';
import { X, Save, Clock, Flame, Leaf, Plus, Trash2, Download, Upload, RotateCcw, Copy } from 'lucide-react';
import { DEFAULT_CATEGORIES, DEFAULT_CONFIG, STAPLES } from './data';

export const Settings = ({ currentProfile, currentPrices, currentStaples, currentCategories, currentCart, onSave, onClose, onImport, onReset }) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Profile & Goals
          </button>
          <button 
            onClick={() => setActiveTab('trip')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'trip' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Trip & Staples
          </button>
          <button 
            onClick={() => setActiveTab('prices')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'prices' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Market Prices
          </button>
          <button 
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'modules' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Modules
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'profile' && (
            <div className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                  <input 
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-rose-500 outline-none"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                  />
                 </div>
                 <div>
                  <label className="text-xs font-bold uppercase text-slate-500">IBS Mode</label>
                  <button
                    onClick={() => setProfile({...profile, ibsMode: !profile.ibsMode})}
                    className={`w-full mt-1 p-3 rounded-lg border text-left text-sm transition-colors ${profile.ibsMode ? 'bg-rose-500/10 border-rose-500 text-rose-100' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    {profile.ibsMode ? 'Strict (Low FODMAP first)' : 'Normal (show everything)'}
                  </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Daily Cals</label>
                  <input 
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-rose-500 outline-none"
                    value={profile.targetDailyCalories}
                    onChange={e => setProfile({...profile, targetDailyCalories: parseFloat(e.target.value) || 0})}
                  />
                 </div>
                 <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Daily Prot</label>
                  <input 
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-rose-500 outline-none"
                    value={profile.targetDailyProtein}
                    onChange={e => setProfile({...profile, targetDailyProtein: parseFloat(e.target.value) || 0})}
                  />
                 </div>
                 <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Trip Days</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-500" size={14} />
                    <input 
                      type="number"
                      step="0.5"
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 pl-8 text-white focus:border-rose-500 outline-none"
                      value={profile.tripDurationDays}
                      onChange={e => setProfile({...profile, tripDurationDays: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                 </div>
               </div>

               <div>
                <label className="text-xs font-bold uppercase text-slate-500">Trip Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 text-sm">EGP</span>
                  <input 
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 pl-12 text-white focus:border-rose-500 outline-none"
                    value={profile.budgetLimit}
                    onChange={e => setProfile({...profile, budgetLimit: parseFloat(e.target.value) || 0})}
                  />
                </div>
               </div>

               <div className="pt-4 border-t border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded accent-rose-500"
                      checked={profile.autoIncludeStaples || false}
                      onChange={e => setProfile({...profile, autoIncludeStaples: e.target.checked})}
                    />
                    <span className="text-slate-200 font-medium">Auto-include Staples on each trip</span>
                  </label>
               </div>
            </div>
          )}

          {activeTab === 'trip' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 flex items-start gap-3">
                <Leaf size={16} className="text-amber-400 mt-1" />
                <div>
                  <div className="font-semibold text-white mb-1">Staples buffer (Rice / Oil / Honey)</div>
                  <p className="text-xs text-slate-500">These calories/cost get injected into every plan to keep the math honest.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Staples Cost (EGP)</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                    value={staples.cost}
                    onChange={e => setStaples({ ...staples, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Staples Calories</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                    value={staples.calories}
                    onChange={e => setStaples({ ...staples, calories: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Staples Protein</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                    value={staples.protein}
                    onChange={e => setStaples({ ...staples, protein: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 flex items-start gap-3">
                <Flame size={16} className="text-rose-400 mt-1" />
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Trip Length</div>
                      <p className="text-xs text-slate-500">Used to average macros and cost per day.</p>
                    </div>
                    <div className="text-sm text-slate-200 font-semibold">{profile.tripDurationDays} days</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                    <span className="bg-slate-900 rounded px-2 py-1">Cost includes staples: {profile.autoIncludeStaples ? 'Yes' : 'No'}</span>
                    <span className="bg-slate-900 rounded px-2 py-1">Avg Cals/day: recalculated</span>
                    <span className="bg-slate-900 rounded px-2 py-1">Avg Prot/day: recalculated</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={resetToDefaults}
                  className="flex-1 border border-slate-700 text-slate-200 rounded-xl py-3 hover:border-slate-500 transition-colors"
                >
                  Reset to Nourish defaults
                </button>
              </div>
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded border border-slate-800">
                Update prices here. They will override the defaults instantly.
              </p>
              {categories.map(cat => (
                <div key={cat.id}>
                  <h3 className="text-xs font-bold uppercase text-emerald-500 mb-2">{cat.title}</h3>
                  <div className="space-y-2">
                    {(cat.items || []).map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-sm text-slate-300">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white focus:border-emerald-500 outline-none text-sm"
                            value={prices[item.id] ?? item.defaultPrice}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          />
                          <span className="text-xs text-slate-500">EGP</span>
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
              <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded border border-slate-800">
                Configure the modules and items shown in the planner. This overrides the default preset from data.js.
              </p>
              {categories.map(cat => (
                <div key={cat.id} className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm font-semibold focus:border-cyan-400 outline-none"
                        value={cat.title}
                        onChange={(e) => updateCategoryField(cat.id, 'title', e.target.value)}
                      />
                      <input
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-xs focus:border-cyan-400 outline-none"
                        value={cat.instruction || ''}
                        onChange={(e) => updateCategoryField(cat.id, 'instruction', e.target.value)}
                        placeholder="Guidance text"
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-[10px] uppercase text-slate-500 font-bold">Min</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-cyan-400 outline-none"
                        value={cat.minSelection}
                        onChange={(e) => updateCategoryField(cat.id, 'minSelection', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button onClick={() => removeCategory(cat.id)} className="text-slate-600 hover:text-rose-400 transition-colors mt-1">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(cat.items || []).map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none"
                              value={item.name}
                              onChange={(e) => updateItemField(cat.id, item.id, 'name', e.target.value)}
                            />
                            <input
                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:border-cyan-400 outline-none"
                              value={item.qty}
                              onChange={(e) => updateItemField(cat.id, item.id, 'qty', e.target.value)}
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Price</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none"
                              value={item.defaultPrice}
                              onChange={(e) => updateItemField(cat.id, item.id, 'defaultPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Cals</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none"
                              value={item.calories}
                              onChange={(e) => updateItemField(cat.id, item.id, 'calories', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Prot</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none"
                              value={item.protein}
                              onChange={(e) => updateItemField(cat.id, item.id, 'protein', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <button onClick={() => removeItem(cat.id, item.id)} className="text-slate-600 hover:text-rose-400 transition-colors mt-6">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <input
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:border-cyan-400 outline-none"
                            value={item.shoppingItem || ''}
                            onChange={(e) => updateItemField(cat.id, item.id, 'shoppingItem', e.target.value)}
                            placeholder="Shopping list label"
                          />
                          <input
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:border-cyan-400 outline-none"
                            value={item.prep || ''}
                            onChange={(e) => updateItemField(cat.id, item.id, 'prep', e.target.value)}
                            placeholder="Prep notes"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addItem(cat.id)}
                      className="w-full border border-dashed border-cyan-500/40 text-cyan-300 rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:border-cyan-400 hover:text-cyan-200"
                    >
                      <Plus size={16} /> Add item
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addCategory}
                className="w-full border border-dashed border-cyan-500/40 text-cyan-300 rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:border-cyan-400 hover:text-cyan-200"
              >
                <Plus size={18} /> Add category
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={save}
            className="w-full bg-white text-slate-950 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};