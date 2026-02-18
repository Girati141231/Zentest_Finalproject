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
        <div className="space-y-6">
            <div className="flex justify-between items-end bg-white/[0.02] p-6 rounded-lg border border-white/5">
                <div className="space-y-2">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Key size={20} className="text-emerald-500" />
                        License Generator
                    </h3>
                    <p className="text-white/40 text-xs">Create new subscription keys for customers.</p>
                </div>
                <div className="flex items-end gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Duration (Days)</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="bg-[#0A0A0A] text-white border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500/50 w-32"
                        >
                            <option value={30}>30 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={365}>1 Year</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="bg-[#0A0A0A] text-white border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500/50 w-20"
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {generating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                        GENERATE KEY
                    </button>
                </div>
            </div>

            <div className="bg-[#0A0A0A] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-white/60 uppercase tracking-widest">Key Inventory ({keys.length})</h3>
                    <button onClick={fetchKeys} className="text-white/20 hover:text-white transition-colors">
                        <RefreshCw size={14} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0A0A0A] text-white/40 text-[10px] uppercase font-bold tracking-wider border-b border-white/5">
                            <tr>
                                <th className="p-4 font-medium pl-6">License Key</th>
                                <th className="p-4 font-medium">Duration</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Redeemed By</th>
                                <th className="p-4 font-medium text-right pr-6">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {keys.map((k) => (
                                <tr key={k.key} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 pl-6 text-white/80 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors"></div>
                                        {k.key}
                                        <button
                                            onClick={() => copyToClipboard(k.key)}
                                            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-all transform scale-90 hover:scale-100"
                                            title="Copy"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-white/50 text-xs">{k.durationDays} Days</td>
                                    <td className="p-4">
                                        {k.isUsed ? (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 text-white/40 bg-white/5 px-2.5 py-1 rounded-full text-[9px] font-bold border border-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                                    REDEEMED
                                                </span>
                                                <button
                                                    onClick={() => handleRevoke(k.key)}
                                                    className="text-white/20 hover:text-red-400 transition-colors p-1"
                                                    title="Revoke / Reset Key"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-[9px] font-bold border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                AVAILABLE
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-white/80 text-xs font-medium">{k.usedByName || '-'}</span>
                                            <span className="text-white/30 text-[9px]">{k.usedByEmail || k.usedBy}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-white/30 text-[10px] text-right">
                                        {new Date(k.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {keys.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/20 italic">
                                        {loading ? 'Loading inventory...' : 'No keys found.'}
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
                    title="Confirm Action"
                    message={confirmConfig.message}
                />
            )}
        </div>
    );
};
