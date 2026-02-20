import React, { useState } from 'react';
import { Key, Users, LogOut, LayoutDashboard } from 'lucide-react';
import { KeyManager } from './KeyManager';
import { UserManager } from './UserManager';

interface AdminDashboardProps {
    onLogout: () => void;
    onBackToPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBackToPortal }) => {
    const [activeTab, setActiveTab] = useState<'keys' | 'users'>('keys');

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-white/20 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />

            {/* Admin Sidebar */}
            <aside className="w-72 border-r border-white/5 flex flex-col bg-[#050505]/80 backdrop-blur-xl z-10">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-3 group">
                        <div className="w-11 h-11 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 p-1.5">
                            <img src="/Zenlogo.png" alt="ZenTest Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black tracking-tighter text-white leading-none">CORE</h2>
                            <span className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase mt-1">Console</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-4">
                    <div className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase mb-4 px-2">Management</div>
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'keys' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Key size={16} /> License Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={16} /> User Directory
                    </button>
                </nav>

                <div className="p-6 border-t border-white/5 space-y-3">
                    <button
                        onClick={onBackToPortal}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-white/40 hover:text-white text-[11px] font-black tracking-widest uppercase transition-all hover:bg-white/5 rounded-lg"
                    >
                        <LayoutDashboard size={14} /> Portal
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-red-500/40 hover:text-red-400 text-[11px] font-black tracking-widest uppercase transition-all hover:bg-red-500/5 rounded-lg"
                    >
                        <LogOut size={14} /> Terminate session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#080808]/50 relative z-0 custom-scrollbar text-white">
                <div className="max-w-6xl mx-auto p-12">
                    <header className="mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
                            System Management
                        </div>
                        <h1 key={activeTab} className="text-4xl font-black text-white tracking-tighter mb-3 leading-none animate-in fade-in slide-in-from-left-4 duration-500">
                            {activeTab === 'keys' ? 'License Control' : 'Personnel Registry'}
                        </h1>
                        <p className="text-white/40 font-medium tracking-tight animate-in fade-in slide-in-from-left-6 duration-700 delay-100">Accessing real-time encrypted data nodes.</p>
                    </header>

                    <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                        {activeTab === 'keys' ? <KeyManager /> : <UserManager />}
                    </div>
                </div>
            </main>
        </div>
    );
};
