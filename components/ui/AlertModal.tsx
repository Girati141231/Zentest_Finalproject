import React from 'react';
import Modal from './Modal';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'info' | 'success' | 'error';
}

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen, onClose, title, message, type = 'info'
}) => {
    let Icon = Info;
    let colorClass = 'text-blue-500';
    let bgClass = 'bg-blue-500/10';

    if (type === 'success') {
        Icon = CheckCircle2;
        colorClass = 'text-green-500';
        bgClass = 'bg-green-500/10';
    } else if (type === 'error') {
        Icon = AlertCircle;
        colorClass = 'text-red-500';
        bgClass = 'bg-red-500/10';
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title || type.toUpperCase()}
            maxWidth="max-w-xs"
        >
            <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className={`p-3 rounded-full ${bgClass} ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <p className="text-sm text-white/80 leading-relaxed font-medium">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="mt-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded transition-colors"
                >
                    OK
                </button>
            </div>
        </Modal>
    );
};

export default AlertModal;
