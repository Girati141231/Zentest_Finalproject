import React from 'react';
import { Layout, ShieldCheck, LogOut } from 'lucide-react';

interface AdminPortalProps {
    onSelectStudio: () => void;
    onSelectAdmin: () => void;
    onLogout: () => void;
    user: any;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onSelectStudio, onSelectAdmin, onLogout, user }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,0,0,0.1),transparent_50%)] pointer-events-none" />

            <div className="z-10 w-full max-w-4xl">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest mb-4">
                        <ShieldCheck size={12} />
                        Administrative Access
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Welcome, Administrator.</h1>
                    <p className="text-white/40 text-lg">Select your workspace.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card 1: Studio */}
                    <button
                        onClick={onSelectStudio}
                        className="group relative bg-[#0A0A0A] border border-white/10 hover:border-white/30 rounded-xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/5"
                    >
                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 group-hover:bg-white text-white group-hover:text-black transition-colors">
                            <Layout size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Zentest Studio</h3>
                        <p className="text-white/40 h-12">Access the standard application interface to build, test, and manage automation projects.</p>
                        <div className="mt-8 flex items-center gap-2 text-sm font-bold text-white/20 group-hover:text-white transition-colors uppercase tracking-widest">
                            Enter Application &rarr;
                        </div>
                    </button>

                    {/* Card 2: Admin Dashboard */}
                    <button
                        onClick={onSelectAdmin}
                        className="group relative bg-[#0A0A0A] border border-white/10 hover:border-emerald-500/30 rounded-xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10"
                    >
                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-white group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Admin Dashboard</h3>
                        <p className="text-white/40 h-12">Manage license keys, user subscriptions, and system configurations securely.</p>
                        <div className="mt-8 flex items-center gap-2 text-sm font-bold text-white/20 group-hover:text-emerald-500 transition-colors uppercase tracking-widest">
                            Manage System &rarr;
                        </div>
                    </button>
                </div>

                <div className="mt-16 text-center">
                    <button onClick={onLogout} className="text-white/20 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 mx-auto">
                        <LogOut size={14} /> SIGN OUT
                    </button>
                </div>
            </div>
        </div>
    );
};
