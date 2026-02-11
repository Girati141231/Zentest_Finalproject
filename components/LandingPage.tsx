import React from 'react';
import { Play, LogIn, ChevronRight, Activity, Zap, Shield, Globe, LayoutDashboard, LogOut } from 'lucide-react';

interface LandingPageProps {
    user: any;
    onLogin: () => void;
    onDemo: () => void;
    onEnterStudio: () => void;
    onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onLogin, onDemo, onEnterStudio, onLogout }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden relative">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '7s' }} />

            {/* Header */}
            <header className="px-8 py-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-bold text-lg">Z</span>
                    </div>
                    <span className="font-semibold tracking-tighter text-xl">ZENTEST</span>
                </div>

                <div className="flex items-center gap-6">
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
                        <a href="#" className="hover:text-white transition-colors">Features</a>
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#" className="hover:text-white transition-colors">Pricing</a>
                    </nav>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Logged in as</div>
                                    <div className="text-xs font-medium">{user.displayName || 'Guest User'}</div>
                                </div>
                                <img
                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Guest')}&background=random`}
                                    className="w-8 h-8 rounded-full border border-white/20"
                                    alt="avatar"
                                />
                            </div>
                            <button
                                onClick={onLogout}
                                className="text-white/40 hover:text-white transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onLogin}
                            className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-full text-xs font-medium hover:bg-white hover:text-black transition-all"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 mt-[-40px]">
                {!user && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium uppercase tracking-widest text-blue-400 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> v2.4 Now Available
                    </div>
                )}

                <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 max-w-4xl leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {user ? (
                        <>
                            Welcome Back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white">
                                {user.displayName || 'Tester'}
                            </span>
                        </>
                    ) : (
                        <>
                            The Operating System for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white">Quality Assurance</span>
                        </>
                    )}
                </h1>

                <p className="text-lg text-white/40 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    {user
                        ? "Your workspace is ready. Access your projects, test cases, and automation details from the dashboard."
                        : "Manage functional and API tests in one unified, high-performance workspace. Designed for modern engineering teams who demand speed and precision."
                    }
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    {user ? (
                        <button
                            onClick={onEnterStudio}
                            className="h-14 px-8 bg-white text-black font-medium rounded-sm hover:bg-blue-50 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] active:scale-95 group text-lg"
                        >
                            <LayoutDashboard size={20} /> Enter Studio
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onLogin}
                                className="h-12 px-8 bg-white text-black font-medium rounded-sm hover:bg-blue-50 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95 group"
                            >
                                <LogIn size={18} /> Start with Google
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={onDemo}
                                className="h-12 px-8 bg-white/5 border border-white/10 text-white font-medium rounded-sm hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <Play size={18} className="fill-white" /> Try Demo Mode
                            </button>
                        </>
                    )}
                </div>

                {/* Feature Grid - Only show for guests */}
                {!user && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        <FeatureCard
                            icon={<Activity size={24} className="text-blue-400" />}
                            title="Functional Testing"
                            description="Create, manage, and track manual test cases with rich formatting and real-time status updates."
                        />
                        <FeatureCard
                            icon={<Globe size={24} className="text-purple-400" />}
                            title="API Management"
                            description="Built-in API client to define, execute, and validate HTTP requests alongside your UI tests."
                        />
                        <FeatureCard
                            icon={<Shield size={24} className="text-emerald-400" />}
                            title="Enterprise Security"
                            description="Role-based access control, audit logs, and secure cloud storage provided by Google Firebase."
                        />
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-white/20 text-xs font-mono">
                <p>&copy; 2024 ZenTest Inc. All rights reserved. System Operational.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group hover:bg-white/[0.04]">
        <div className="mb-4 p-3 bg-white/5 rounded-md w-fit group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 text-white/90">{title}</h3>
        <p className="text-sm text-white/40 leading-relaxed">{description}</p>
    </div>
);

export default LandingPage;
