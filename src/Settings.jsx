import React, { useState } from 'react';
import { X, Save, Clock, Flame, Leaf } from 'lucide-react';
import { CATEGORIES, DEFAULT_CONFIG, STAPLES } from './data';

export const Settings = ({ currentProfile, currentPrices, currentStaples, onSave, onClose }) => {
  const [profile, setProfile] = useState(currentProfile);
  const [prices, setPrices] = useState(currentPrices);
  const [staples, setStaples] = useState(currentStaples || STAPLES);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'trip' | 'prices'

  const handlePriceChange = (id, val) => {
    setPrices(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  };

  const save = () => {
    onSave(profile, prices, staples);
    onClose();
  };

  const resetToDefaults = () => {
    setProfile({ ...DEFAULT_CONFIG, name: profile.name || '', autoIncludeStaples: false });
    setStaples(STAPLES);
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
                    onChange={e => setProfile({...profile, targetDailyCalories: parseInt(e.target.value) || 0})}
                  />
                 </div>
                 <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Daily Prot</label>
                  <input 
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-rose-500 outline-none"
                    value={profile.targetDailyProtein}
                    onChange={e => setProfile({...profile, targetDailyProtein: parseInt(e.target.value) || 0})}
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
                    onChange={e => setProfile({...profile, budgetLimit: parseInt(e.target.value) || 0})}
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
                    onChange={e => setStaples({ ...staples, cost: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Staples Calories</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                    value={staples.calories}
                    onChange={e => setStaples({ ...staples, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Staples Protein</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                    value={staples.protein}
                    onChange={e => setStaples({ ...staples, protein: parseInt(e.target.value) || 0 })}
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
              {CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <h3 className="text-xs font-bold uppercase text-emerald-500 mb-2">{cat.title}</h3>
                  <div className="space-y-2">
                    {cat.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-sm text-slate-300">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white focus:border-emerald-500 outline-none text-sm"
                            value={prices[item.id] || item.defaultPrice}
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