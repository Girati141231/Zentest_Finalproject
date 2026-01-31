import React, { useState } from 'react';
import { Shield, Key, CheckCircle2, AlertCircle, X, ExternalLink, Loader2 } from 'lucide-react';
import { LicenseService } from '../services/license';

interface LicenseRedemptionProps {
    user: any;
    userDoc: any;
    onClose: () => void;
}

const LicenseRedemption: React.FC<LicenseRedemptionProps> = ({ user, userDoc, onClose }) => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleActivate = async () => {
        if (!key.trim()) return;
        setLoading(true);
        setStatus(null);

        try {
            const result = await LicenseService.redeem(key.trim(), user.uid);
            if (result.success) {
                setStatus({ type: 'success', message: result.message });
                setKey('');
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || "Activation failed" });
        } finally {
            setLoading(false);
        }
    };

    const expiryDate = userDoc?.validUntil?.toMillis ? new Date(userDoc.validUntil.toMillis()) : null;
    const isPro = expiryDate && expiryDate > new Date();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-white/20 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-white/[0.04] p-6 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md border ${isPro ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/10 border-white/20 text-white'}`}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg tracking-tight">Membership</h2>
                            <p className="text-white/60 text-xs">Manage your subscription</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Card */}
                    <div className={`p-4 rounded border ${isPro ? 'bg-green-500/5 border-green-500/20' : 'bg-white/[0.05] border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Current Plan</span>
                            {isPro ? <CheckCircle2 size={14} className="text-green-400" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
                        </div>
                        <div className="flex items-baseline justify-between">
                            <div className={`text-2xl font-black tracking-tight ${isPro ? 'text-green-400' : 'text-white'}`}>
                                {isPro ? 'PRO MEMBER' : 'FREE TIER'}
                            </div>
                            {isPro && expiryDate && (
                                <div className="text-[10px] font-mono text-green-400/80 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                    EXP: {expiryDate.toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Key Input */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Enter License Key</label>
                            <div className="relative group">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    className="w-full bg-[#111] border border-white/20 rounded p-3 pl-10 text-white font-mono text-sm placeholder:text-white/20 outline-none focus:border-white/40 focus:bg-[#161616] transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleActivate}
                            disabled={loading || !key}
                            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/10"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'ACTIVATE KEY'}
                        </button>

                        {status && (
                            <div className={`p-3 rounded text-xs flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                                <span className="font-medium">{status.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Link */}
                    <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-3">
                        <a href="#" className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest font-bold">
                            Purchase a License <ExternalLink size={10} />
                        </a>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenseRedemption;
