import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '../constants';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div 
        ref={modalRef}
        className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl animate-fade-in-scale flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
            <h2 id="demo-modal-title" className="text-lg font-bold text-white">GhostCode Demo</h2>
            <button 
                type="button" 
                onClick={onClose} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close demo modal"
            >
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>
        <div className="aspect-w-16 aspect-h-9 bg-black">
            {/* In a real app, use a real video source. Using a placeholder. */}
            <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            ></iframe>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
