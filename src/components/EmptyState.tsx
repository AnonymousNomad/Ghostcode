import React from 'react';
import { GhostIcon } from '../constants';

interface EmptyStateProps {
    onActionClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onActionClick }) => {
  return (
    <div className="text-center bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl py-16 px-6 flex flex-col items-center justify-center transition-all">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <GhostIcon className="relative mx-auto h-16 w-16 text-slate-500 animate-float" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-white">Your Ghost Chamber is Empty</h3>
      <p className="mt-2 text-slate-400 max-w-sm mx-auto">
        It looks like you haven't captured any services yet. Create your first ghost to start debugging production in your local environment.
      </p>
      <div className="mt-8">
        <button
          type="button"
          onClick={onActionClick}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-6 rounded-lg transition-transform hover:scale-105 transform shadow-lg shadow-cyan-600/20"
        >
          Capture Your First Ghost
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
