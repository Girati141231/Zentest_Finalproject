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

    // Detailed view (if we want to expand a user) - keeping it simple for now, just list
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
                    await fetchUsers(); // Refresh data
                    setAlertConfig({ message: 'User subscription extended.', type: 'success' });
                } catch (e) {
                    setAlertConfig({ message: 'Failed to update user.', type: 'error' });
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/[0.02] p-6 rounded-lg border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-end">
                <div className="space-y-2 w-full md:w-auto">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <UserIcon size={20} className="text-blue-500" />
                        User Database
                    </h3>
                    <p className="text-white/40 text-xs">Manage registered users and subscriptions.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded px-9 py-2 text-white outline-none focus:border-blue-500/50 text-sm"
                        />
                    </div>
                    <button onClick={fetchUsers} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-2 rounded transition-colors">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-[#0A0A0A] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                    <h3 className="font-bold text-sm text-white/60 uppercase tracking-widest">Registered Users ({filteredUsers.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0A0A0A] text-white/40 text-[10px] uppercase font-bold tracking-wider border-b border-white/5">
                            <tr>
                                <th className="p-4 pl-6">User Info</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Subscription Valid Until</th>
                                <th className="p-4 text-right pr-6">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/20 font-bold overflow-hidden">
                                                {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={14} />}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-xs">{user.displayName || 'Unknown User'}</div>
                                                <div className="text-white/40 text-[10px]">{user.email || user.uid}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {user.tier === 'pro' ? (
                                            <span className="inline-flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20">
                                                PRO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-white/30 bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold border border-white/5">
                                                FREE
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-white/60 text-xs">
                                        {user.validUntil?.toMillis
                                            ? new Date(user.validUntil.toMillis()).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                            {/* Tier Toggle */}
                                            <div className="flex bg-white/5 rounded p-0.5 border border-white/5 mr-2">
                                                <button
                                                    onClick={() => {
                                                        if (user.tier === 'free') return;
                                                        setConfirmConfig({
                                                            message: `Downgrade ${user.displayName || 'user'} to FREE?`,
                                                            onConfirm: async () => {
                                                                await AdminService.updateUserTier(user.uid, 'free');
                                                                fetchUsers();
                                                            }
                                                        });
                                                    }}
                                                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${user.tier !== 'pro' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
                                                >
                                                    FREE
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (user.tier === 'pro') return;
                                                        setConfirmConfig({
                                                            message: `Upgrade ${user.displayName || 'user'} to PRO?`,
                                                            onConfirm: async () => {
                                                                await AdminService.updateUserTier(user.uid, 'pro');
                                                                if (!user.validUntil || (user.validUntil.toMillis && user.validUntil.toMillis() < Date.now())) {
                                                                    await AdminService.extendUserSubscription(user.uid, 30);
                                                                }
                                                                fetchUsers();
                                                            }
                                                        });
                                                    }}
                                                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${user.tier === 'pro' ? 'bg-green-500/20 text-green-400' : 'text-white/30 hover:text-emerald-400'}`}
                                                >
                                                    PRO
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleExtend(user.uid, 30)}
                                                className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-2 py-1 rounded border border-white/5 transition-colors"
                                            >
                                                +30D
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-white/20 italic">
                                        No users found.
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
