import React from 'react';
import { InformationCircleIcon } from '../constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isConfirming,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-scale">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <InformationCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
            </div>
            <div className="flex-grow">
              <h2 id="modal-title" className="text-lg font-bold text-white">{title}</h2>
              <p className="text-sm text-slate-400 mt-2">{message}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end items-center gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-red-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
          >
            {isConfirming ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;