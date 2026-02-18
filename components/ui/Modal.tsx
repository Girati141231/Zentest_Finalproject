import React from 'react';
import { XCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-xl"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`bg-[#0a0a0a] border border-white/10 rounded-sm w-full ${maxWidth} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        style={{ animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/Zenlogo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-white/90 uppercase">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;