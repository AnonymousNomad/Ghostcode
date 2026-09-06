import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircleIcon, InformationCircleIcon, XMarkIcon } from '../constants';

const icons = {
  success: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
  error: <XMarkIcon className="h-6 w-6 text-red-400" />,
  info: <InformationCircleIcon className="h-6 w-6 text-blue-400" />,
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 p-4 sm:p-6 space-y-3 z-[100]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-4 flex items-start gap-3 animate-fade-in"
          role="alert"
        >
          <div className="shrink-0">{icons[toast.type]}</div>
          <p className="flex-grow text-sm text-slate-300">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="shrink-0 text-slate-500 hover:text-white transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
