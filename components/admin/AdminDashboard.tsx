import React, { useState } from 'react';
import { Key, Users, LogOut, LayoutDashboard } from 'lucide-react';
import { KeyManager } from './KeyManager';
import { UserManager } from './UserManager';

interface AdminDashboardProps {
    onLogout: () => void;
    onBackToPortal: () => void; // Or back to app chooser
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBackToPortal }) => {
    const [activeTab, setActiveTab] = useState<'keys' | 'users'>('keys');

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col bg-[#050505]">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-xs">ADMIN</div>
                        PANEL
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'keys' ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Key size={18} /> License Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={18} /> User Management
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={onBackToPortal}
                        className="w-full flex items-center gap-3 px-4 py-2 text-white/40 hover:text-white text-xs font-bold transition-colors"
                    >
                        <LayoutDashboard size={14} /> Back to Portal
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-500/50 hover:text-red-500 text-xs font-bold transition-colors"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#080808]">
                <div className="max-w-5xl mx-auto p-12">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {activeTab === 'keys' ? 'License Key Inventory' : 'User Database'}
                        </h1>
                        <p className="text-white/40">Manage your application resources securely.</p>
                    </header>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'keys' ? <KeyManager /> : <UserManager />}
                    </div>
                </div>
            </main>
        </div>
    );
};
