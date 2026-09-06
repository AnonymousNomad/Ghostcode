import React, { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchGhosts, deleteGhost } from '../api';
import { Ghost } from '../types';
import { CalendarDaysIcon, CircleStackIcon, ChevronDownIcon, TrashIcon, ExclamationTriangleIcon } from '../constants';
import { useToast } from '../context/ToastContext';

import CreateGhostWizard from './CreateGhostWizard';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';
import ConfirmationModal from './ConfirmationModal';

const GhostList: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const { data: ghosts, isLoading, isError, error, refetch } = useQuery<Ghost[], Error>({
    queryKey: ['ghosts'],
    queryFn: fetchGhosts,
  });

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [ghostToDelete, setGhostToDelete] = useState<Ghost | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteGhost,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['ghosts'], (oldData: Ghost[] | undefined) => oldData?.filter(g => g.id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['ghosts'] });
      addToast('Ghost deleted successfully!', 'success');
      setGhostToDelete(null);
    },
    onError: (err: Error) => {
      addToast(`Error: ${err.message}`, 'error');
      setGhostToDelete(null);
    }
  });

  const handleRowClick = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  
  const handleDeleteClick = (e: React.MouseEvent, ghost: Ghost) => {
    e.stopPropagation();
    setGhostToDelete(ghost);
  };
  
  const handleReplayClick = (e: React.MouseEvent, ghostId: number) => {
    e.stopPropagation();
    navigate(`/replay/${ghostId}`);
  }

  const renderContent = () => {
    if (isLoading) {
      return <SkeletonLoader />;
    }
    if (isError) {
      return (
        <div className="text-center bg-red-900/20 border border-red-500/30 rounded-xl py-12 px-6 flex flex-col items-center justify-center transition-all" role="alert">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">Failed to Load Ghosts</h3>
            <p className="mt-2 text-red-300/80 max-w-md mx-auto">
                There was a problem fetching your ghosts. Please check your connection and try again.
            </p>
            {error?.message && <p className="mt-2 text-xs text-slate-500 font-mono bg-slate-800/50 p-2 rounded">Details: {error.message}</p>}
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
    if (!ghosts || ghosts.length === 0) {
        return <EmptyState onActionClick={() => setIsWizardOpen(true)} />;
    }

    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="p-4 font-semibold text-sm">Name</th>
              <th className="p-4 font-semibold text-sm hidden sm:table-cell">Created</th>
              <th className="p-4 font-semibold text-sm hidden md:table-cell">Size</th>
              <th className="p-4 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ghosts.map(ghost => (
              <Fragment key={ghost.id}>
                <tr 
                  className="border-b border-slate-800 last:border-b-0 transition-colors cursor-pointer hover:bg-slate-800/25"
                  onClick={() => handleRowClick(ghost.id)}
                  aria-expanded={expandedRow === ghost.id}
                >
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <span>{ghost.name}</span>
                      <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${expandedRow === ghost.id ? 'rotate-180' : ''}`} />
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>{new Date(ghost.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <CircleStackIcon className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>{ghost.size_mb} MB</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => handleReplayClick(e, ghost.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold py-1 px-3 rounded-lg transition-colors"
                      >
                        Replay
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(e, ghost)} 
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-full transition-colors hover:bg-red-500/10"
                        aria-label={`Delete ghost ${ghost.name}`}
                      >
                          <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === ghost.id && (
                  <tr className="bg-slate-800/25">
                    <td colSpan={4} className="p-4">
                      <div className="text-sm text-slate-400 animate-fade-in">
                        <p className="font-semibold text-slate-300 mb-2">Details</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="sm:hidden">
                                <p className="font-medium text-slate-500">Created</p>
                                <p>{new Date(ghost.created_at).toLocaleString()}</p>
                            </div>
                            <div className="md:hidden">
                                <p className="font-medium text-slate-500">Size</p>
                                <p>{ghost.size_mb} MB</p>
                            </div>
                             <div className="col-span-2 hidden sm:block md:hidden">
                                <p className="text-slate-500">This area shows more details on smaller screens.</p>
                            </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 mt-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse"></span>
            Active Ghost Clones
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">List of currently mounted local debugger instances.</p>
        </div>
      </div>

      {renderContent()}

      <CreateGhostWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      
      <ConfirmationModal 
        isOpen={!!ghostToDelete}
        title="Terminate Ghost Instance"
        message={`Are you sure you want to permanently detach and delete "${ghostToDelete?.name}"? The local snapshot will be unmounted.`}
        onConfirm={() => {
            if(ghostToDelete) {
                deleteMutation.mutate(ghostToDelete.id);
            }
        }}
        onCancel={() => setGhostToDelete(null)}
        isConfirming={deleteMutation.isPending}
        confirmText="Terminate"
      />
    </div>
  );
};

export default GhostList;