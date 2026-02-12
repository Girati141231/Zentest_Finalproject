import React, { useEffect, useRef, useState } from 'react';
import { Play, LogIn, ChevronRight, Activity, Zap, Shield, Globe, LayoutDashboard, LogOut, Check, X, Terminal, Code, Scan } from 'lucide-react';

interface LandingPageProps {
    user: any;
    onLogin: () => void;
    onDemo: () => void;
    onEnterStudio: () => void;
    onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onLogin, onDemo, onEnterStudio, onLogout }) => {
    const [isLoginTransition, setIsLoginTransition] = useState(false);
    const prevUserRef = useRef(user);

    useEffect(() => {
        // Detect login (user goes from null -> object)
        if (!prevUserRef.current && user) {
            setIsLoginTransition(true);
            const timer = setTimeout(() => setIsLoginTransition(false), 1500);
            return () => clearTimeout(timer);
        }
        prevUserRef.current = user;
    }, [user]);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden relative">
            {/* System Scanner Overlay */}
            {isLoginTransition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-green-500/30 animate-ping absolute inset-0" />
                            <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center relative bg-black">
                                <Scan size={32} className="text-green-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-green-500 font-mono text-sm tracking-widest animate-pulse">
                            IDENTITY VERIFIED... ACCESS GRANTED
                        </div>
                    </div>
                </div>
            )}
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '7s' }} />

            {/* Header */}
            <header className="px-8 py-6 flex items-center justify-between z-10 sticky top-0 bg-[#050505]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-bold text-lg">Z</span>
                    </div>
                    <span className="font-semibold tracking-tighter text-xl">ZENTEST</span>
                </div>

                <div className="flex items-center gap-6">
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
            <main className="flex-1 flex flex-col items-center pt-32 pb-20 text-center px-6 relative z-10" key={user ? 'user' : 'guest'}>
                <ScrollReveal>
                    <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 max-w-5xl leading-tight">
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
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                    <p className="text-lg text-white/40 max-w-3xl mb-10 leading-relaxed">
                        {user
                            ? "Your workspace is ready. Access your projects, test cases, and automation details from the dashboard."
                            : "Manage functional and API tests in one unified, high-performance workspace. Designed for modern engineering teams who demand speed and precision."
                        }
                    </p>
                </ScrollReveal>

                <ScrollReveal delay={0.4}>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
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
                </ScrollReveal>

                {/* Additional Content - Only show for guests */}
                {!user && (
                    <div className="w-full flex flex-col items-center">

                        {/* 1. Problem / Solution Section */}
                        <div className="mt-40 max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                            <ScrollReveal>
                                <div className="p-8 rounded-xl bg-red-500/5 border border-red-500/10 h-full">
                                    <div className="bg-red-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-6 text-red-400">
                                        <X size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-red-200">The Old Way</h3>
                                    <ul className="space-y-4 text-white/50">
                                        <li className="flex items-start gap-3">
                                            <span className="mt-1 text-red-500/50">●</span>
                                            Scattered Google Sheets & Jira tickets
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="mt-1 text-red-500/50">●</span>
                                            Manual execution without real-time tracking
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="mt-1 text-red-500/50">●</span>
                                            Disconnected API postman collections
                                        </li>
                                    </ul>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={0.2}>
                                <div className="p-8 rounded-xl bg-emerald-500/5 border border-emerald-500/10 h-full relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />
                                    <div className="relative z-10">
                                        <div className="bg-emerald-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-6 text-emerald-400">
                                            <Check size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 text-emerald-200">The ZenTest Way</h3>
                                        <ul className="space-y-4 text-white/70">
                                            <li className="flex items-start gap-3">
                                                <Check size={16} className="mt-1 text-emerald-400" />
                                                Unified workspace for Functional & API Tests
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <Check size={16} className="mt-1 text-emerald-400" />
                                                Live Status Dashboard & Team Sync
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <Check size={16} className="mt-1 text-emerald-400" />
                                                One-click Automation pipelines
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>

                        {/* 2. Value Props / Feature Grid */}
                        <div className="mt-40 max-w-7xl w-full">
                            <ScrollReveal>
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need <br /> to ship with confidence</h2>
                                    <p className="text-white/40 max-w-2xl mx-auto">Stop wrestling with tools. Start testing.</p>
                                </div>
                            </ScrollReveal>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                <ScrollReveal delay={0.1}>
                                    <FeatureCard
                                        icon={<Activity size={24} className="text-blue-400" />}
                                        title="Functional Testing"
                                        description="Create, manage, and track manual test cases with rich formatting and real-time status updates."
                                    />
                                </ScrollReveal>
                                <ScrollReveal delay={0.2}>
                                    <FeatureCard
                                        icon={<Globe size={24} className="text-purple-400" />}
                                        title="API Management"
                                        description="Built-in API client to define, execute, and validate HTTP requests alongside your UI tests."
                                    />
                                </ScrollReveal>
                                <ScrollReveal delay={0.3}>
                                    <FeatureCard
                                        icon={<Shield size={24} className="text-emerald-400" />}
                                        title="Enterprise Security"
                                        description="Role-based access control, audit logs, and secure cloud storage provided by Google Firebase."
                                    />
                                </ScrollReveal>
                            </div>
                        </div>

                        {/* 3. Code Preview Section */}
                        <ScrollReveal>
                            <div className="mt-40 max-w-5xl w-full border border-white/10 rounded-xl bg-[#0A0A0A] overflow-hidden shadow-2xl">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                    <div className="ml-4 text-xs text-white/30 font-mono">automation-pipeline.ts</div>
                                </div>
                                <div className="p-6 overflow-x-auto text-left font-mono text-sm">
                                    <div className="text-blue-400">const <span className="text-yellow-200">suite</span> = <span className="text-purple-400">new</span> <span className="text-yellow-200">AutomationSuite</span>();</div>
                                    <div className="mt-2 text-white/50">{'// Define your test flow visually or via code'}</div>
                                    <div className="text-purple-400">await <span className="text-white">suite</span>.<span className="text-blue-300">run</span>({'{'}</div>
                                    <div className="pl-4 text-white">
                                        <span className="text-blue-300">target</span>: <span className="text-green-300">'production'</span>,
                                    </div>
                                    <div className="pl-4 text-white">
                                        <span className="text-blue-300">parallel</span>: <span className="text-purple-400">true</span>,
                                    </div>
                                    <div className="pl-4 text-white">
                                        <span className="text-blue-300">retries</span>: <span className="text-yellow-400">3</span>
                                    </div>
                                    <div className="text-white">{'}'});</div>
                                    <div className="mt-4 text-green-400">{'>> Test execution started...'}</div>
                                    <div className="text-green-400">{'>> All systems operational.'}</div>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* 4. Final CTA */}
                        <ScrollReveal>
                            <div className="mt-40 mb-20">
                                <h2 className="text-4xl font-bold mb-8">Ready to modernize your QA?</h2>
                                <button
                                    onClick={onLogin}
                                    className="h-16 px-10 bg-white text-black font-bold text-lg rounded-full hover:bg-blue-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] active:scale-95"
                                >
                                    Get Started for Free
                                </button>
                            </div>
                        </ScrollReveal>

                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-white/20 text-xs font-mono border-t border-white/5">
                <p>&copy; 2024 ZenTest Inc. All rights reserved. System Operational.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-8 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group hover:bg-white/[0.04] h-full">
        <div className="mb-4 p-3 bg-white/5 rounded-md w-fit group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 text-white/90">{title}</h3>
        <p className="text-sm text-white/40 leading-relaxed">{description}</p>
    </div>
);

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.8s cubic-bezier(0.17, 0.55, 0.55, 1) ${delay}s`
            }}
        >
            {children}
        </div>
    );
};

export default LandingPage;
