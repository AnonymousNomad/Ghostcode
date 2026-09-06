import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ShieldCheckIcon, TrashIcon } from '../constants';

export const SecurityPage: React.FC = () => {
  const [activePreset, setActivePreset] = useState<'standard' | 'hipaa' | 'custom'>('standard');
  const [customRules, setCustomRules] = useState([
    { id: 1, field: 'email', regex: '.*@.*\\\\..*', maskType: '[REDACTED]' },
    { id: 2, field: 'credit_card', regex: '\\\\b\\\\d{4}-\\\\d{4}-\\\\d{4}-\\\\d{4}\\\\b', maskType: '[OBFUSCATED]' },
  ]);

  const addRule = () => {
    setCustomRules([...customRules, { id: Date.now(), field: '', regex: '', maskType: '[REDACTED]' }]);
    setActivePreset('custom');
  };

  const removeRule = (id: number) => {
    setCustomRules(customRules.filter(r => r.id !== id));
    setActivePreset('custom');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      <div className="relative z-10 flex flex-col flex-grow">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          <div className="mb-8 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Security & PII Shield Matrix
              </h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              Configure data sanitization rules for Ghost instances. All production payloads matching these patterns will be scrubbed at the gateway before streaming to the local sandbox.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Compliance Presets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActivePreset('standard')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    activePreset === 'standard' 
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">Standard PII</div>
                  <div className="text-xs text-slate-400">Masks emails, phone numbers, and common API keys.</div>
                </button>
                <button
                  onClick={() => setActivePreset('hipaa')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    activePreset === 'hipaa' 
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">Strict HIPAA</div>
                  <div className="text-xs text-slate-400">Aggressive scrubbing of all patient health information (PHI) and metadata.</div>
                </button>
                <button
                  onClick={() => setActivePreset('custom')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    activePreset === 'custom' 
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">Custom Rules</div>
                  <div className="text-xs text-slate-400">Use manually defined regex expressions below.</div>
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Custom Scrubbing Matrix</h2>
                <button 
                  onClick={addRule}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg transition-colors border border-cyan-400/20"
                >
                  <span>+ Add Rule</span>
                </button>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3">Target Field</div>
                  <div className="col-span-5">Regex Pattern</div>
                  <div className="col-span-3">Mask Output</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                
                <div className="divide-y divide-slate-700/50">
                  {customRules.map((rule, idx) => (
                    <div key={rule.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center group">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={rule.field}
                          onChange={(e) => {
                            const newRules = [...customRules];
                            newRules[idx].field = e.target.value;
                            setCustomRules(newRules);
                            setActivePreset('custom');
                          }}
                          placeholder="e.g. user_id"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={rule.regex}
                          onChange={(e) => {
                            const newRules = [...customRules];
                            newRules[idx].regex = e.target.value;
                            setCustomRules(newRules);
                            setActivePreset('custom');
                          }}
                          placeholder="Regex string"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={rule.maskType}
                          onChange={(e) => {
                            const newRules = [...customRules];
                            newRules[idx].maskType = e.target.value;
                            setCustomRules(newRules);
                            setActivePreset('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="[REDACTED]">[REDACTED]</option>
                          <option value="[OBFUSCATED]">[OBFUSCATED]</option>
                          <option value="[ANONYMIZED]">[ANONYMIZED]</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Rule"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {customRules.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      No custom rules defined. Click "Add Rule" to create one.
                    </div>
                  )}
                </div>
              </div>
            </section>
            
            <div className="flex justify-end pt-4">
               <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] transition-all">
                  Save Shield Configuration
               </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SecurityPage;
