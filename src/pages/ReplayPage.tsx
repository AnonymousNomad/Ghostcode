import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGhostById } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
    ArrowLeftIcon, 
    PlayIcon, 
    PauseIcon, 
    BackwardIcon, 
    ForwardIcon,
    TerminalIcon,
    VariableIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    GhostIcon
} from '../constants';

type Tab = 'logs' | 'env' | 'memory';

const ReplayPage: React.FC = () => {
    const { ghostId } = useParams<{ ghostId: string }>();
    const numericGhostId = Number(ghostId);

    const { data: ghost, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['ghost', numericGhostId],
        queryFn: () => fetchGhostById(numericGhostId),
        enabled: !isNaN(numericGhostId),
    });

    const [activeTab, setActiveTab] = useState<Tab>('logs');
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(35); // Mock progress

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8 animate-pulse">
                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl min-h-[400px] flex items-center justify-center">
                        <div className="space-y-4">
                           <GhostIcon className="h-16 w-16 text-slate-700 mx-auto" />
                           <div className="h-4 w-48 bg-slate-700 rounded-md"></div>
                        </div>
                    </div>
                </div>
            )
        }
        if (isError || !ghost) {
             return (
                <div className="text-center bg-red-900/20 border border-red-500/30 rounded-xl py-12 px-6 flex flex-col items-center justify-center transition-all" role="alert">
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-4 text-xl font-semibold text-white">Failed to Load Ghost Details</h3>
                    <p className="mt-2 text-red-300/80 max-w-md mx-auto">
                        There was a problem fetching the details for this ghost. It might not exist or there could be a network issue.
                    </p>
                    {error && <p className="mt-2 text-xs text-slate-500 font-mono bg-slate-800/50 p-2 rounded">Details: {(error as Error).message}</p>}
                    <div className="mt-8">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        const tabs: { id: Tab; name: string; icon: React.ReactNode }[] = [
            { id: 'logs', name: 'Logs', icon: <TerminalIcon className="h-5 w-5" /> },
            { id: 'env', name: 'Environment', icon: <VariableIcon className="h-5 w-5" /> },
            { id: 'memory', name: 'Memory Dump', icon: <CpuChipIcon className="h-5 w-5" /> },
        ];

        return (
            <div className="flex flex-col flex-grow bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden animate-fade-in">
                {/* Tab Content */}
                <div className="p-4 sm:p-6 flex-grow overflow-auto min-h-[400px]">
                    {activeTab === 'logs' && (
                        <pre className="text-sm text-slate-300 bg-slate-900/70 p-4 rounded-lg overflow-x-auto h-full font-mono">
                            <code>
                                {ghost.details?.state.logs.join('\n') || 'No logs available.'}
                            </code>
                        </pre>
                    )}
                    {activeTab === 'env' && (
                        <div className="text-sm bg-slate-900/70 p-4 rounded-lg overflow-x-auto h-full font-mono">
                            {ghost.details?.state.env ? Object.entries(ghost.details.state.env).map(([key, value]) => (
                                <div key={key} className="flex">
                                    <span className="text-blue-400 mr-2">{key}=</span>
                                    <span className="text-green-400">"{value}"</span>
                                </div>
                            )) : <p className="text-slate-400">No environment variables captured.</p>}
                        </div>
                    )}
                     {activeTab === 'memory' && (
                        <pre className="text-sm text-slate-300 bg-slate-900/70 p-4 rounded-lg overflow-x-auto h-full font-mono">
                            <code>
                                {ghost.details?.state.memoryDump || 'No memory dump available.'}
                            </code>
                        </pre>
                    )}
                </div>

                {/* Timeline and Controls */}
                <div className="border-t border-slate-700 bg-slate-800 p-4 space-y-4">
                     {/* Tabs */}
                    <div className="flex items-center border-b border-slate-700 -mx-4 px-4 pb-4">
                         <nav className="flex space-x-2" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                                        px-3 py-2 font-medium text-sm rounded-lg transition-colors flex items-center gap-2
                                    `}
                                    aria-current={activeTab === tab.id ? 'page' : undefined}
                                >
                                    {tab.icon}
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                                <BackwardIcon className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-3 text-white bg-cyan-600 hover:bg-cyan-500 rounded-full transition-colors shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"
                            >
                                {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                            </button>
                             <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                                <ForwardIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <span className="text-xs font-mono text-slate-400">01:23</span>
                        <input 
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => setProgress(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer range-sm accent-cyan-500"
                        />
                         <span className="text-xs font-mono text-slate-400">03:59</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
            <div className="relative z-10 flex flex-col flex-grow">
                <Header />
                <main className="flex-grow container mx-auto px-6 py-12 flex flex-col">
                   <div className="space-y-6 flex flex-col flex-grow">
                        <div>
                            <Link to="/dashboard" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4">
                                <ArrowLeftIcon className="h-4 w-4" />
                                <span>Back to Dashboard</span>
                            </Link>
                            <h1 className="text-3xl font-bold text-white">Replaying: {ghost?.name || '...'}</h1>
                            <p className="text-slate-400 mt-1">Inspecting captured state for ghost ID: {ghostId}</p>
                        </div>

                        {renderContent()}
                   </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ReplayPage;
