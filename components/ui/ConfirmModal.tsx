import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = true
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="max-w-sm"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full flex-shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-white/80 leading-relaxed font-bold">
                            {message}
                        </p>
                        <p className="text-xs text-white/40">
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-sm text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-6 py-2 rounded-sm text-xs font-bold text-white transition-all shadow-lg ${isDestructive ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
                    >
                        {confirmText.toUpperCase()}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
