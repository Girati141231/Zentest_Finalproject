import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Calendar, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { AdminService } from '../../services/admin';
import { User } from '../../types';

import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            console.error(error);
            setAlertConfig({ message: 'Failed to fetch users.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
        } else {
            const q = searchQuery.toLowerCase();
            const filtered = users.filter(u =>
                u.uid.toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.displayName || '').toLowerCase().includes(q)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const handleExtend = async (uid: string, days: number) => {
        setConfirmConfig({
            message: `Add ${days} days to this user?`,
            onConfirm: async () => {
                try {
                    await AdminService.extendUserSubscription(uid, days);
                    await fetchUsers();
                    setAlertConfig({ message: 'User subscription extended.', type: 'success' });
                } catch (e) {
                    setAlertConfig({ message: 'Failed to update user.', type: 'error' });
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="bg-white/[0.02] p-8 rounded-2xl border border-white/5 backdrop-blur-md flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-2xl">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">
                        <UserIcon size={10} /> Personnel Management
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter text-white leading-none">User Database</h3>
                    <p className="text-white/60 text-sm font-medium tracking-tight">Active monitoring of registered entities and their entitlement cycles.</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors duration-300" size={14} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Query UID, Email or Name..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-blue-500/50 transition-all font-medium text-xs hover:border-white/20"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg active:rotate-180 duration-500"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-blue-400" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-[#050505] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-xs text-white/60 uppercase tracking-[0.3em]">Identity Hub</h3>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black text-white/40">{filteredUsers.length} ARCHIVED</span>
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                <th className="px-8 py-6">Entity Profile</th>
                                <th className="px-8 py-6">Tier Level</th>
                                <th className="px-8 py-6">Term Validity</th>
                                <th className="px-8 py-6 text-right">Operational Logic</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/[0.01] transition-all group border-transparent">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-white/5 to-white/[0.08] p-[1px] shadow-inner shrink-0 overflow-hidden">
                                                <div className="w-full h-full rounded-[11px] bg-black/40 flex items-center justify-center overflow-hidden">
                                                    {user.photoURL ? (
                                                        <img
                                                            src={user.photoURL}
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-blue-400 text-xs">${user.displayName?.[0] || '?'}</div>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <UserIcon size={16} className="text-white/20" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-white font-black text-[13px] tracking-tight truncate">{user.displayName || 'Unnamed Fragment'}</div>
                                                <div className="text-white/60 text-[10px] font-medium truncate font-mono">{user.email || user.uid}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {user.tier === 'pro' ? (
                                            <span className="inline-flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                                PRO GRADE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-white/20 bg-white/5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border border-white/5">
                                                FREE ACCESS
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-white/70 text-[11px] font-mono font-medium">
                                            <Calendar size={12} className="text-white/40" />
                                            {user.validUntil?.toMillis
                                                ? new Date(user.validUntil.toMillis()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'PERPETUAL'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all items-center translate-x-2 group-hover:translate-x-0">
                                            {/* Tier Switch */}
                                            <div className="flex bg-white/[0.03] rounded-lg p-1 border border-white/5 shadow-inner">
                                                <button
                                                    onClick={() => {
                                                        if (user.tier === 'free') return;
                                                        setConfirmConfig({
                                                            message: `Revert entity ${user.displayName || 'segment'} to baseline FREE access?`,
                                                            onConfirm: async () => {
                                                                await AdminService.updateUserTier(user.uid, 'free');
                                                                fetchUsers();
                                                            }
                                                        });
                                                    }}
                                                    className={`px-3 py-1 text-[9px] font-black tracking-[0.1em] rounded-md transition-all ${user.tier !== 'pro' ? 'bg-white/10 text-white shadow-md' : 'text-white/20 hover:text-white'}`}
                                                >
                                                    FREE
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (user.tier === 'pro') return;
                                                        setConfirmConfig({
                                                            message: `Elevate entity ${user.displayName || 'segment'} to PRO grade status?`,
                                                            onConfirm: async () => {
                                                                await AdminService.updateUserTier(user.uid, 'pro');
                                                                if (!user.validUntil || (user.validUntil.toMillis && user.validUntil.toMillis() < Date.now())) {
                                                                    await AdminService.extendUserSubscription(user.uid, 30);
                                                                }
                                                                fetchUsers();
                                                            }
                                                        });
                                                    }}
                                                    className={`px-3 py-1 text-[9px] font-black tracking-[0.1em] rounded-md transition-all ${user.tier === 'pro' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-indigo-400'}`}
                                                >
                                                    PRO
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleExtend(user.uid, 30)}
                                                className="text-[10px] font-black bg-white/[0.05] hover:bg-white text-white/60 hover:text-black px-3 py-1.5 rounded-lg border border-white/10 transition-all active:scale-95 shadow-lg tracking-widest"
                                            >
                                                +30 DAY CYCLE
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/10">
                                            <UserIcon size={48} strokeWidth={1} />
                                            <span className="text-xs uppercase tracking-[0.3em] font-black">No Entities Found</span>
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
                    title="Control Authorization"
                    message={confirmConfig.message}
                />
            )}
        </div>
    );
};
