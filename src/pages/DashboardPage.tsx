import React, { useState } from 'react';
import Header from '../components/Header';
import GhostList from '../components/GhostList';
import Footer from '../components/Footer';
import LiveSystemBlueprint from '../components/LiveSystemBlueprint';
import OneClickCloneWizard from '../components/OneClickCloneWizard';
import { SparklesIcon, ChevronDownIcon, ServerIcon, ShieldCheckIcon, CpuChipIcon } from '../constants';

const DashboardPage: React.FC = () => {
  const [isWizardExpanded, setIsWizardExpanded] = useState(true);
  const [isModalWizardOpen, setIsModalWizardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      <div className="relative z-10 flex flex-col flex-grow">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-10">
            {/* Dashboard Overview Header with Stats & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>System Operational</span>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">v2.4.0 Engine</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
                  Production Debugger Dashboard
                </h1>
                <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                  Clone live, running production microservices into time-traveling local debug instances with zero service interruption.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalWizardOpen(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-5 rounded-lg text-sm shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Launch 1-Click Clone</span>
                </button>
              </div>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono">1-Click</div>
                  <div className="text-xs text-slate-400">Zero-Downtime Clone</div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono">PII Shield</div>
                  <div className="text-xs text-slate-400">Auto Secret Masking</div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
                  <ServerIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono">mTLS & IAM</div>
                  <div className="text-xs text-slate-400">Multi-Credential Suite</div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]">
                  <CpuChipIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono">Time-Travel</div>
                  <div className="text-xs text-slate-400">Heap & Call-Stack</div>
                </div>
              </div>
            </div>

            {/* Embedded 1-Click Clone Setup Wizard on Dashboard */}
            <section aria-labelledby="wizard-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 animate-pulse">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 id="wizard-heading" className="text-lg font-bold text-white">
                      1-Click Clone Setup Wizard
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Step-by-step assistant for target service discovery and local container deployment.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsWizardExpanded(!isWizardExpanded)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <span>{isWizardExpanded ? 'Collapse Wizard' : 'Expand Wizard'}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isWizardExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {isWizardExpanded ? (
                <div className="animate-fade-in">
                  <OneClickCloneWizard isEmbedded={true} />
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700/70 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-sm text-slate-300">
                      Wizard collapsed. Ready to clone production services with custom URL & credentials.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWizardExpanded(true)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Open Setup Wizard &rarr;
                  </button>
                </div>
              )}
            </section>

            {/* Live System Blueprint */}
            <LiveSystemBlueprint />

            {/* Active Clones (GhostList) */}
            <GhostList />
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal Version of Wizard if launched from header button */}
      <OneClickCloneWizard
        isOpen={isModalWizardOpen}
        onClose={() => setIsModalWizardOpen(false)}
        isEmbedded={false}
      />
    </div>
  );
};

export default DashboardPage;
