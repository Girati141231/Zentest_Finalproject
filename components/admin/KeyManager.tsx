import React, { useState, useEffect } from 'react';
import { Key, Plus, RefreshCw, Copy, RotateCcw } from 'lucide-react';
import { AdminService } from '../../services/admin';
import { LicenseKey } from '../../types';

import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

export const KeyManager: React.FC = () => {
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [duration, setDuration] = useState(30);
    const [quantity, setQuantity] = useState(1);
    const [alertConfig, setAlertConfig] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getAllKeys();
            setKeys(data);
        } catch (error) {
            console.error(error);
            setAlertConfig({ message: 'Failed to fetch keys. Are you Admin?', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await AdminService.generateKey(duration, quantity);
            await fetchKeys();
            setAlertConfig({ message: `Successfully generated ${quantity} key(s)!`, type: 'success' });
        } catch (error) {
            setAlertConfig({ message: 'Failed to generate key', type: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setAlertConfig({ message: 'License Key copied to clipboard!', type: 'success' });
    };

    const handleRevoke = async (key: string) => {
        setConfirmConfig({
            message: `Are you sure you want to revoke/reset license key ${key}?`,
            onConfirm: async () => {
                try {
                    await AdminService.revokeKey(key);
                    fetchKeys();
                    setAlertConfig({ message: 'Key revoked successfully.', type: 'info' });
                } catch (error) {
                    setAlertConfig({ message: 'Failed to revoke key.', type: 'error' });
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.02] p-8 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
                <div className="space-y-3 mb-6 md:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">
                        <Key size={10} /> Encryption & Entitlement
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter text-white">License Minting</h3>
                    <p className="text-white/60 text-sm font-medium tracking-tight">Provisioning new high-tier access tokens for workspace instances.</p>
                </div>
                <div className="flex items-end gap-5 shrink-0">
                    <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] pl-1">Duration</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500/50 transition-all hover:border-white/20 w-36"
                        >
                            <option value={30}>30 Standard Days</option>
                            <option value={90}>90 Extended Days</option>
                            <option value={365}>365 Annual Cycle</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] pl-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500/50 transition-all hover:border-white/20 w-24"
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-30 shadow-lg shadow-emerald-500/10 active:scale-95 whitespace-nowrap h-[42px]"
                    >
                        {generating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                        Generate Licenses
                    </button>
                </div>
            </div>

            <div className="bg-[#050505] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-xs text-white/60 uppercase tracking-[0.3em]">Vault Inventory</h3>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black text-white/40">{keys.length} ENTIRETY</span>
                    </div>
                    <button onClick={fetchKeys} className="p-2 text-white/40 hover:text-white transition-all hover:bg-white/5 rounded-lg active:rotate-180 duration-500">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                <th className="px-8 py-6">License Hash</th>
                                <th className="px-8 py-6">Lifespan</th>
                                <th className="px-8 py-6">Verification</th>
                                <th className="px-8 py-6">Redeemed Node</th>
                                <th className="px-8 py-6 text-right">Generation Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {keys.map((k) => (
                                <tr key={k.key} className="hover:bg-white/[0.01] transition-all group border-transparent">
                                    <td className="px-8 py-5 text-white/80 font-mono text-xs flex items-center gap-4">
                                        <div className={`w-1.5 h-1.5 rounded-full ${k.isUsed ? 'bg-white/10' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'} transition-all`}></div>
                                        <span className="tracking-wider text-white"> {k.key} </span>
                                        <button
                                            onClick={() => copyToClipboard(k.key)}
                                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-blue-400 transition-all p-1.5 rounded-lg hover:bg-blue-500/10"
                                            title="Copy Hash"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[11px] font-black text-white/60 tracking-tight">{k.durationDays} Standard Cycles</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        {k.isUsed ? (
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center gap-2 text-white/60 bg-white/10 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border border-white/20">
                                                    REDEEMED
                                                </span>
                                                <button
                                                    onClick={() => handleRevoke(k.key)}
                                                    className="text-white/40 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-500/10"
                                                    title="Emergency Reset"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                AVAILABLE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        {k.isUsed ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-white font-bold text-xs tracking-tight">{k.usedByName || 'Anonymous User'}</span>
                                                <span className="text-white/60 text-[10px] font-medium">{k.usedByEmail}</span>
                                            </div>
                                        ) : (
                                            <span className="text-white/30 text-xs font-black tracking-widest">-</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-white/60 text-[11px] text-right font-mono font-medium">
                                        {new Date(k.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                            {keys.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/10">
                                            <Key size={48} strokeWidth={1} />
                                            <span className="text-xs uppercase tracking-[0.3em] font-black">{loading ? 'Accessing Vault...' : 'Empty Inventory'}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AlertModal
                isOpen={!!alertConfig}
                onClose={() => setAlertConfig(null)}
                message={alertConfig?.message || ''}
                type={alertConfig?.type}
            />

            {confirmConfig && (
                <ConfirmModal
                    isOpen={true}
                    onClose={() => setConfirmConfig(null)}
                    onConfirm={confirmConfig.onConfirm}
                    title="Security Confirmation"
                    message={confirmConfig.message}
                />
            )}
        </div>
    );
};
