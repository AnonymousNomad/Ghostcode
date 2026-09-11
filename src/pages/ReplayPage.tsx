import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGhostById } from '../api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowLeftIcon, ExclamationTriangleIcon, GhostIcon } from '../constants';
import { MemoryInspector } from '../components/inspector/MemoryInspector';

const ReplayPage: React.FC = () => {
  const { ghostId } = useParams<{ ghostId: string }>();
  const numericGhostId = Number(ghostId);

  const { data: ghost, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ghost', numericGhostId],
    queryFn: () => fetchGhostById(numericGhostId),
    enabled: !isNaN(numericGhostId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <GhostIcon className="h-16 w-16 text-slate-700 mx-auto animate-pulse" />
          <div className="h-4 w-48 bg-slate-700 rounded-md mt-4 animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !ghost) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-12">
          <div className="text-center bg-red-900/20 border border-red-500/30 rounded-xl py-12 px-6 flex flex-col items-center justify-center" role="alert">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">Failed to Load Ghost Details</h3>
            <p className="mt-2 text-red-300/80 max-w-md mx-auto">
              There was a problem fetching the details for this ghost. It might not exist or there could be a network issue.
            </p>
            {error && <p className="mt-2 text-xs text-slate-500 font-mono bg-slate-800/50 p-2 rounded">Details: {(error as Error).message}</p>}
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-8 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const snapshot = ghost.details?.state?.snapshot;

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
              <h1 className="text-3xl font-bold text-white">Replaying: {ghost.name}</h1>
              <p className="text-slate-400 mt-1">Inspecting captured state for ghost ID: {ghostId}</p>
              {snapshot && (
                <p className="text-xs text-slate-500 mt-1">
                  Phase 3 Time-Travel Inspector · {snapshot.stats.frameCount} frames · {snapshot.stats.allocationCount} allocations · press <kbd className="px-1 bg-slate-800 rounded">←</kbd> <kbd className="px-1 bg-slate-800 rounded">→</kbd> <kbd className="px-1 bg-slate-800 rounded">space</kbd> to navigate
                </p>
              )}
            </div>

            {snapshot ? (
              <MemoryInspector snapshot={snapshot} />
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                No structured snapshot available for this ghost. The legacy memory dump:
                <pre className="mt-4 text-xs text-slate-300 bg-slate-900/70 p-4 rounded-lg overflow-x-auto text-left font-mono">
                  {ghost.details?.state?.memoryDump || 'No memory dump available.'}
                </pre>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ReplayPage;
