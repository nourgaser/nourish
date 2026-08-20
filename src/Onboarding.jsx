import React, { useState } from 'react';
import { ChevronRight, User, Target, Wallet, Check } from 'lucide-react';
import { Logo } from './Logo';
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from './data';

export const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: "",
    budgetLimit: DEFAULT_PROFILE.budgetLimit,
    tripDurationDays: DEFAULT_PROFILE.tripDurationDays,
    ibsMode: DEFAULT_PROFILE.ibsMode,
    // Onboarding only collects the two targets most people have an opinion
    // on up front; everything else (fat/fiber/micros, personal context,
    // diet notes) keeps its default and is editable later in Settings.
    targets: {
      ...DEFAULT_TARGETS,
      kcal: { ...DEFAULT_TARGETS.kcal },
      protein: { ...DEFAULT_TARGETS.protein },
    },
  });

  const setKcalTarget = (value) => {
    const target = parseFloat(value) || 0;
    setData(prev => ({ ...prev, targets: { ...prev.targets, kcal: { ...prev.targets.kcal, target } } }));
  };

  const setProteinFloor = (value) => {
    const floor = parseFloat(value) || 0;
    setData(prev => ({ ...prev, targets: { ...prev.targets, protein: { ...prev.targets.protein, floor } } }));
  };

  const next = () => setStep(s => s + 1);
  const finish = () => onComplete(data);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (step === 4) {
      finish();
      return;
    }
    if (step === 1 && !data.name.trim()) return;
    next();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-rose-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <Logo />
            </div>
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-center mb-2">Welcome to NOURISH</h2>
              <p className="text-slate-400 text-center mb-6 text-sm">Let's personalize your kitchen OS.</p>
              
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">What should we call you?</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  placeholder="Your Name"
                  value={data.name}
                  onChange={e => setData({...data, name: e.target.value})}
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                disabled={!data.name}
                className="w-full mt-6 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8">
              <h2 className="text-xl font-bold text-center mb-6">Nutritional Targets</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
                    <Target size={14} /> Daily Calories
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-rose-500 outline-none"
                    value={data.targets.kcal.target}
                    onChange={e => setKcalTarget(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Recommended for Bulking: 2700+</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
                    <Target size={14} /> Daily Protein (g)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-rose-500 outline-none"
                    value={data.targets.protein.floor}
                    onChange={e => setProteinFloor(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Next</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8">
              <h2 className="text-xl font-bold text-center mb-6">Money Matters</h2>
              
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
                  <Wallet size={14} /> Trip Budget (EGP)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                  value={data.budgetLimit}
                  onChange={e => setData({...data, budgetLimit: parseFloat(e.target.value) || 0})}
                />
                <p className="text-[10px] text-slate-500 mt-1">Usually ~750 EGP for a 3-4 day trip.</p>
              </div>

              <button type="submit" className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Next</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-8">
              <h2 className="text-xl font-bold text-center mb-6">Dietary Style</h2>
              
              <div 
                onClick={() => setData({...data, ibsMode: !data.ibsMode})}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between
                ${data.ibsMode ? 'bg-rose-500/10 border-rose-500' : 'bg-slate-950 border-slate-800 opacity-60'}`}
              >
                <div>
                  <div className="font-bold text-slate-200">IBS Sensitive Mode</div>
                  <div className="text-xs text-slate-400 mt-1">Prioritize Low FODMAP (Lactose Free, No Garlic/Onion bulbs)</div>
                </div>
                {data.ibsMode && <Check size={20} className="text-rose-500" />}
              </div>

              <button 
                type="submit"
                className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                Launch App <Check size={18} />
              </button>
            </div>
          )}

        </div>
      </form>
    </div>
  );
};