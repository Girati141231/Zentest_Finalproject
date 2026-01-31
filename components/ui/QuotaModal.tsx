import React from 'react';
import Modal from './Modal';
import { Lock, Crown } from 'lucide-react';

interface QuotaModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    onUpgrade: () => void;
}

const QuotaModal: React.FC<QuotaModalProps> = ({
    isOpen, onClose, message, onUpgrade
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="LIMIT REACHED"
            maxWidth="max-w-sm"
        >
            <div className="flex flex-col gap-6 text-center items-center py-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative z-10">
                        <Lock size={32} className="text-white/40" />
                    </div>
                    <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1.5 shadow-lg animate-pulse">
                        <Crown size={12} className="text-black fill-black" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">Free Tier Limit</h3>
                    <p className="text-sm text-white/60 leading-relaxed max-w-[280px]">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col w-full gap-3 mt-2">
                    <button
                        onClick={() => { onUpgrade(); onClose(); }}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5 border border-white/10 flex items-center justify-center gap-2"
                    >
                        <Crown size={16} fill="currentColor" />
                        UPGRADE TO PRO
                    </button>
                    <button
                        onClick={onClose}
                        className="text-xs text-white/30 hover:text-white transition-colors py-2 uppercase tracking-widest font-bold"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default QuotaModal;
