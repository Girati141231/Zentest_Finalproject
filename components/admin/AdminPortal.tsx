import React from 'react';
import { LogOut, ChevronRight, Sparkles } from 'lucide-react';

interface AdminPortalProps {
    onSelectStudio: () => void;
    onSelectAdmin: () => void;
    onLogout: () => void;
    user: any;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onSelectStudio, onSelectAdmin, onLogout, user }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Layers for Depth */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150 pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

            <div className="z-10 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-xl">
                        <Sparkles size={12} className="text-blue-400" />
                        Administrative Access
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] text-balance">
                        Welcome, <span className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">Administrator.</span>
                    </h1>
                    <p className="text-white/40 text-lg md:text-xl font-medium tracking-tight">Select your workspace to continue.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                    {/* Card 1: Studio */}
                    <button
                        onClick={onSelectStudio}
                        className="group relative bg-white/[0.02] border border-white/10 hover:border-blue-500/50 rounded-2xl p-10 text-left transition-all duration-500 backdrop-blur-xl hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.2)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />

                        <div className="w-14 h-14 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/[0.05] transition-all duration-500 shadow-inner p-2">
                            <img src="/Zenlogo.png" alt="ZenTest Logo" className="w-full h-full object-contain" />
                        </div>

                        <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">Zentest Studio</h3>
                        <p className="text-white/40 leading-relaxed font-medium">
                            Access the standard application interface to build, test, and manage automation projects with high performance.
                        </p>

                        <div className="mt-12 flex items-center gap-2 text-xs font-black text-white/20 group-hover:text-blue-400 transition-all duration-300 uppercase tracking-[0.2em]">
                            Enter Workspace <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    {/* Card 2: Admin Dashboard */}
                    <button
                        onClick={onSelectAdmin}
                        className="group relative bg-white/[0.02] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-10 text-left transition-all duration-500 backdrop-blur-xl hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />

                        <div className="w-14 h-14 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/[0.05] transition-all duration-500 shadow-inner p-2">
                            <img src="/Zenlogo.png" alt="ZenTest Logo" className="w-full h-full object-contain" />
                        </div>

                        <h3 className="text-3xl font-black text-white mb-3 tracking-tighter group-hover:text-emerald-400 transition-colors">System Core</h3>
                        <p className="text-white/40 leading-relaxed font-medium">
                            Manage license keys, user subscriptions, and system configurations securely within the administrative cluster.
                        </p>

                        <div className="mt-12 flex items-center gap-2 text-xs font-black text-white/20 group-hover:text-emerald-500 transition-all duration-300 uppercase tracking-[0.2em]">
                            Manage System <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="mt-20 text-center">
                    <button
                        onClick={onLogout}
                        className="group text-white/20 hover:text-white text-[11px] font-black tracking-[0.25em] transition-all flex items-center justify-center gap-3 mx-auto px-6 py-2 rounded-full hover:bg-white/[0.05]"
                    >
                        <LogOut size={14} className="group-hover:text-red-500 transition-colors" /> SIGN OUT OF SESSION
                    </button>
                </div>
            </div>

            {/* Subtlest bottom gradient */}
            <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-blue-500/[0.03] to-transparent pointer-events-none" />
        </div>
    );
};
