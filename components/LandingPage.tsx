import React, { useEffect, useRef, useState } from 'react';
import { Play, LogIn, ChevronRight, Activity, Zap, Globe, LayoutDashboard, LogOut, ArrowRight, Star } from 'lucide-react';



interface LandingPageProps {
    user: any;
    onLogin: () => void;
    onDemo: () => void;
    onEnterStudio: () => void;
    onLogout: () => void;
    onLicense: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onLogin, onDemo, onEnterStudio, onLogout, onLicense }) => {

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">

            {/* Premium Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Asymmetric Spotlight for Left Align */}
                <div className="absolute top-[-20%] left-0 w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#020202] to-[#020202] blur-[100px] opacity-60" />
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#020202] to-[#020202] blur-[100px] opacity-50" />

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* Header */}
            <header className="px-6 md:px-12 py-6 flex items-center justify-between z-50 sticky top-0 bg-[#020202]/80 backdrop-blur-xl border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <img src="/Zenlogo.png" alt="ZenTest Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold tracking-tight text-xl text-white">ZENTEST</span>
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Pro License</div>
                                    <div className="text-sm font-medium text-white/90">{user.displayName || 'Tester'}</div>
                                </div>
                                <div className="relative group cursor-pointer w-9 h-9">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            className="w-full h-full rounded-full border-2 border-white/10 group-hover:border-indigo-500 transition-colors object-cover"
                                            alt="avatar"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-indigo-400 text-xs">${user.displayName?.[0] || '?'}</div>`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full border-2 border-white/10 group-hover:border-indigo-500 transition-colors bg-white/5 flex items-center justify-center font-bold text-indigo-400 text-xs">
                                            {user.displayName?.[0] || '?'}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#020202] rounded-full"></div>
                                </div>
                            </div>
                            <button
                                onClick={onLicense}
                                className="p-2 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all flex items-center gap-2"
                                title="Manage Membership"
                            >
                                <Zap size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Membership</span>
                            </button>
                            <button
                                onClick={onLogout}
                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onDemo}
                                className="hidden md:flex text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Live Demo
                            </button>
                            <button
                                onClick={onLogin}
                                className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                <LogIn size={16} /> Sign In
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center relative z-10 w-full max-w-[1400px] mx-auto px-6">

                {/* HERO SECTION - LEFT ALIGNED & CLEAN */}
                <section className="w-full pt-32 pb-40 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto z-20 relative gap-12">

                    {/* Left Content */}
                    <div className="flex-1 text-left md:max-w-xl lg:max-w-2xl">
                        <ScrollReveal>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                v2.0 is now live
                            </div>

                            <h1 className="text-7xl lg:text-9xl font-medium tracking-tighter mb-8 text-white drop-shadow-2xl selection:bg-white selection:text-black leading-[0.9]">
                                Ship <br /> Confidently.
                            </h1>
                        </ScrollReveal>

                        <ScrollReveal delay={0.2}>
                            <h2 className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-lg leading-relaxed font-light">
                                The modern workspace for manual, API, and automated testing. <span className="text-zinc-200 font-normal">One platform, zero friction.</span>
                            </h2>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3}>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full sm:w-auto">
                                {user ? (
                                    <button
                                        onClick={onEnterStudio}
                                        className="h-14 px-8 min-w-[180px] bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-[0_4px_30px_rgba(255,255,255,0.15)] active:scale-95 text-lg"
                                    >
                                        <LayoutDashboard size={20} /> Enter Studio
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={onLogin}
                                            className="h-14 px-8 min-w-[180px] bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(255,255,255,0.15)] active:scale-95 text-lg"
                                        >
                                            Get Started
                                            <ChevronRight size={18} />
                                        </button>

                                        <button
                                            onClick={onDemo}
                                            className="h-14 px-8 min-w-[180px] text-white font-medium rounded-full border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-lg"
                                        >
                                            <Play size={18} className="fill-white" /> Watch Demo
                                        </button>
                                    </>
                                )}
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Side Visual - Abstract Card Stack to Balance Layout */}
                    <div className="hidden md:flex flex-1 justify-end relative pointer-events-none pr-12">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]" />

                        <ScrollReveal delay={0.4}>
                            <div className="relative z-10 w-[400px] h-[500px]">
                                {/* Back Card */}
                                <div className="absolute top-0 right-0 w-full h-full bg-white/[0.03] border border-white/5 rounded-[32px] rotate-6 scale-90 translate-x-4 backdrop-blur-sm" />
                                {/* Middle Card */}
                                <div className="absolute top-0 right-0 w-full h-full bg-white/[0.05] border border-white/5 rounded-[32px] rotate-3 scale-95 translate-x-2 backdrop-blur-sm shadow-2xl" />
                                {/* Front Card - Main Visual */}
                                <div className="absolute top-0 right-0 w-full h-full bg-[#0A0A0A] border border-white/10 rounded-[32px] p-6 flex flex-col shadow-2xl overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

                                    {/* Fake UI Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <Activity size={16} />
                                            </div>
                                            <div className="text-sm font-medium text-white/80">Test Run #842</div>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">PASS</div>
                                    </div>

                                    {/* Fake UI Content */}
                                    <div className="space-y-4 flex-1">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border border-green-500/50 bg-green-500/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            </div>
                                            <div className="h-2 w-32 bg-white/20 rounded-full" />
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border border-green-500/50 bg-green-500/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            </div>
                                            <div className="h-2 w-40 bg-white/20 rounded-full" />
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 animate-pulse">
                                            <div className="w-4 h-4 rounded-full border border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                            </div>
                                            <div className="h-2 w-24 bg-white/20 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Bottom Gradient Fade */}
                                    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                </section>

                {/* VISUAL & BENTO GRID SECTION (Only for Guest) */}
                {!user && (
                    <div className="w-full flex flex-col gap-32 pb-32">

                        {/* FEATURE GRID */}
                        <section className="w-full max-w-7xl mx-auto px-4">
                            <div className="text-left mb-20 max-w-3xl">
                                <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3">Powerfully Simple</h2>
                                <h3 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Everything you need to ship confident code.</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Card 1: Dashboard */}
                                <div className="col-span-1 md:col-span-2 p-1 rounded-3xl bg-gradient-to-b from-white/[0.1] to-white/[0.02] hover:from-indigo-500/20 hover:to-indigo-500/5 transition-all duration-500 group">
                                    <div className="bg-[#050505] rounded-[22px] h-full p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:border-indigo-500/40 group-hover:scale-110 transition-all duration-300">
                                                <LayoutDashboard className="text-indigo-400" size={24} />
                                            </div>
                                            <h4 className="text-2xl font-bold mb-3 text-white">Unified Command Center</h4>
                                            <p className="text-zinc-400 leading-relaxed max-w-md mb-8">
                                                Stop tab-switching. Manage manual test runs, automated suites, and API checks in one high-performance dashboard.
                                            </p>
                                        </div>

                                        {/* Abstract UI Mockup */}
                                        <div className="w-full h-40 bg-zinc-900/50 rounded-t-xl border border-white/10 p-4 relative translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                            <div className="flex gap-2 mb-4">
                                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                                                <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                                <div className="h-2 w-full bg-white/5 rounded-full" />
                                            </div>
                                            <div className="absolute bottom-4 right-4 flex gap-2">
                                                <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded">PASS</span>
                                                <span className="text-[10px] text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded">running...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: API Client */}
                                <div className="col-span-1 p-1 rounded-3xl bg-gradient-to-b from-white/[0.1] to-white/[0.02] hover:from-purple-500/20 hover:to-purple-500/5 transition-all duration-500 group">
                                    <div className="bg-[#050505] rounded-[22px] h-full p-8 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-500" />

                                        <div className="relative z-10 mb-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:border-purple-500/40 group-hover:scale-110 transition-all duration-300">
                                                <Globe className="text-purple-400" size={24} />
                                            </div>
                                            <h4 className="text-2xl font-bold mb-3 text-white">Native API Client</h4>
                                            <p className="text-zinc-400 leading-relaxed">
                                                No more Context Switching. Send REST requests directly alongside your UI tests.
                                            </p>
                                        </div>

                                        <div className="mt-8 text-xs text-zinc-500 bg-black/50 p-4 rounded-lg border border-white/5 group-hover:border-purple-500/30 transition-colors">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-purple-300">GET</span>
                                                <span className="text-white">/api/v1/users</span>
                                            </div>
                                            <div className="text-green-400">200 OK (45ms)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 3: Automation */}
                                <div className="col-span-1 md:col-span-3 p-1 rounded-3xl bg-gradient-to-b from-white/[0.1] to-white/[0.02] hover:from-emerald-500/20 hover:to-emerald-500/5 transition-all duration-500 group">
                                    <div className="bg-[#050505] rounded-[22px] h-full p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                                        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                        <div className="relative z-10 flex-1 text-center md:text-left">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                                                <Zap size={12} className="fill-emerald-400" />
                                                INSTANT PIPELINES
                                            </div>
                                            <h4 className="text-2xl font-bold mb-3 text-white">Zero-Config Automation</h4>
                                            <p className="text-zinc-400 leading-relaxed max-w-xl">
                                                Record your manual tests and convert them to automated scripts with one click.
                                            </p>
                                        </div>

                                        <div className="relative z-10 flex gap-4">
                                            <div className="flex flex-col items-center gap-2 group-hover:translate-y-[-5px] transition-transform duration-300">
                                                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                                    1
                                                </div>
                                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Record</span>
                                            </div>
                                            <div className="h-12 w-[1px] bg-white/10 my-auto rotate-90 md:rotate-0" />
                                            <div className="flex flex-col items-center gap-2 group-hover:translate-y-[-5px] transition-transform duration-300 delay-75">
                                                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                                    2
                                                </div>
                                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Review</span>
                                            </div>
                                            <div className="h-12 w-[1px] bg-white/10 my-auto rotate-90 md:rotate-0" />
                                            <div className="flex flex-col items-center gap-2 group-hover:translate-y-[-5px] transition-transform duration-300 delay-100">
                                                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                                    3
                                                </div>
                                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Run</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </section>

                        {/* FINAL CTA */}
                        <section className="text-center max-w-4xl mx-auto px-6 mb-20 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 blur-[100px] opacity-50 pointer-events-none" />
                            <div className="relative z-10 bg-[#0A0A0A] border border-white/10 rounded-3xl p-12 md:p-20 overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Ready to ship better software?</h2>
                                <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">Join thousands of developers and QA engineers who are testing faster with ZenTest.</p>

                                <button
                                    onClick={onLogin}
                                    className="h-16 px-12 bg-white text-black font-bold text-lg rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)] active:scale-95"
                                >
                                    Start Testing Free
                                </button>
                                <p className="mt-6 text-xs text-zinc-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                                    <Star size={12} className="fill-zinc-500" /> No credit card required
                                </p>
                            </div>
                        </section>

                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-12 text-center text-zinc-600 text-sm font-medium border-t border-white/[0.05] bg-[#020202]">
                <div className="flex justify-center gap-8 mb-8">
                    <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
                    <span className="hover:text-white cursor-pointer transition-colors">API Status</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                </div>
                <p>&copy; 2024 ZenTest Inc. Designed for quality.</p>
            </footer>
        </div >
    );
};

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
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
            }}
        >
            {children}
        </div>
    );
};

export default LandingPage;
