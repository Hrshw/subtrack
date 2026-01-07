import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import Meta from '../components/Meta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import {
    Zap,
    Shield,
    TrendingUp,
    ArrowRight,
    Github,
    Server,
    Cloud,
    Database,
    Code2,
    Terminal,
    Cpu,
    Globe,
    Lock,
    MessageSquare,
    Gift,
    BarChart3
} from 'lucide-react';

// ---- UTILS ----

function useMousePosition() {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useEffect(() => {
        const updateMouse = (e: MouseEvent) => {
            x.set(e.clientX);
            y.set(e.clientY);
        };
        window.addEventListener('mousemove', updateMouse);
        return () => window.removeEventListener('mousemove', updateMouse);
    }, [x, y]);

    return { x, y };
}

// ---- INTERACTIVE FLOATING ICONS (ANTIGRAVITY EFFECT) ----

const FloatingIcon = ({ icon: Icon, delay, initialX, initialY, depth = 1 }: { icon: React.ElementType, delay: number, initialX: number, initialY: number, depth?: number }) => {
    const { x: mouseX, y: mouseY } = useMousePosition();
    const ref = useRef<HTMLDivElement>(null);

    // Random float animation
    const randomX = useSpring(0, { stiffness: 5, damping: 10 });
    const randomY = useSpring(0, { stiffness: 5, damping: 10 });

    useEffect(() => {
        const interval = setInterval(() => {
            randomX.set(Math.random() * 20 - 10);
            randomY.set(Math.random() * 20 - 10);
        }, 2000 + Math.random() * 1000);
        return () => clearInterval(interval);
    }, [randomX, randomY]);

    // Magnetic/Repulsion Logic
    const x = useTransform(mouseX, (val) => {
        if (!ref.current) return 0;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const dist = val - centerX;
        // Stronger repulsion when close, subtle attraction when far? 
        // Let's do a "parallax" feel + repulsion
        return (dist / -20) * depth;
    });

    const y = useTransform(mouseY, (val) => {
        if (!ref.current) return 0;
        const rect = ref.current.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = val - centerY;
        return (dist / -20) * depth;
    });

    const rotateX = useTransform(mouseY, (val) => {
        if (!ref.current) return 0;
        const rect = ref.current.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        return (val - centerY) / -20; // Tilt based on mouse Y
    });

    const rotateY = useTransform(mouseX, (val) => {
        if (!ref.current) return 0;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        return (val - centerX) / 20; // Tilt based on mouse X
    });

    // Smooth out the transforms
    const springConfig = { damping: 15, stiffness: 150, mass: 0.5 };
    const smoothX = useSpring(x, springConfig);
    const smoothY = useSpring(y, springConfig);
    const smoothRotateX = useSpring(rotateX, springConfig);
    const smoothRotateY = useSpring(rotateY, springConfig);

    return (
        <motion.div
            ref={ref}
            style={{
                x: smoothX,
                y: smoothY,
                rotateX: smoothRotateX,
                rotateY: smoothRotateY,
                left: `${initialX}%`,
                top: `${initialY}%`,
                perspective: 1000
            }}
            className="absolute pointer-events-none z-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 1, type: 'spring' }}
        >
            <motion.div
                style={{ x: randomX, y: randomY }}
                className="text-slate-700/20 backdrop-blur-[1px]"
            >
                <Icon size={40 + depth * 20} strokeWidth={1.5} />
            </motion.div>
        </motion.div>
    );
};

// ---- ODOMETER DIGIT COLUMN ----

const DIGIT_HEIGHT = 80; // Increased for impact

const DigitColumn: React.FC<{ targetDigit: number; delay: number }> = ({ targetDigit, delay }) => {
    const sequence = React.useMemo(() => {
        const arr: number[] = [];
        for (let i = 0; i <= targetDigit; i++) arr.push(i);
        return arr;
    }, [targetDigit]);

    return (
        <div className="overflow-hidden h-[80px] w-[0.6em] relative inline-block align-top mx-[1px]">
            <motion.div
                initial={{ y: 0 }}
                whileInView={{ y: -DIGIT_HEIGHT * (sequence.length - 1) }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay, ease: [0.2, 1, 0.2, 1] }} // Custom ease for "mechanical" feel
                className="flex flex-col items-center"
            >
                {sequence.map((d, idx) => (
                    <span key={idx} className="h-[80px] flex items-center justify-center leading-none font-mono font-bold bg-clip-text text-transparent bg-gradient-to-b from-emerald-300 to-emerald-600">
                        {d}
                    </span>
                ))}
            </motion.div>
            {/* Gradient Masks for 3D Cylinder effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 pointer-events-none" />
        </div>
    );
};

const OdometerNumber: React.FC<{ value: number; delayOffset?: number }> = ({ value, delayOffset = 0 }) => {
    const digits = value.toString().split('');
    return (
        <div className="inline-flex items-center tracking-tighter bg-slate-900/50 border border-emerald-500/20 rounded-xl px-4 py-2 shadow-inner shadow-black/50 backdrop-blur-sm">
            {digits.map((digit, idx) => (
                <DigitColumn key={idx} targetDigit={Number(digit)} delay={delayOffset + idx * 0.15} />
            ))}
        </div>
    );
};

// ---- INTEGRATIONS MARQUEE ----

const IntegrationIcon = ({ name, icon: Icon, isComingSoon }: { name: string, icon: React.ElementType, isComingSoon?: boolean }) => (
    <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300">
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isComingSoon ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform'}`}>
            <Icon size={20} strokeWidth={2} />
        </div>
        <span className={`text-sm font-bold tracking-tight ${isComingSoon ? 'text-slate-500' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
            {name}
        </span>
        {isComingSoon && (
            <span className="text-[10px] font-black bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                Soon
            </span>
        )}
    </div>
);

const IntegrationsSection = () => {
    const integrations = [
        { name: 'AWS', icon: Server },
        { name: 'GitHub', icon: Github },
        { name: 'Vercel', icon: Zap },
        { name: 'Stripe', icon: Globe },
        { name: 'OpenAI', icon: Cpu },
        { name: 'Linear', icon: TrendingUp },
        { name: 'Sentry', icon: Shield },
        { name: 'Resend', icon: Globe },
        { name: 'Clerk', icon: Lock },
        { name: 'DigitalOcean', icon: Server },
        { name: 'Supabase', icon: Database },
        { name: 'Notion', icon: Code2 },
        { name: 'Slack', icon: MessageSquare }, // Notifications are live
    ];

    // Double the list for seamless loop
    const displayIntegrations = [...integrations, ...integrations];

    return (
        <section className="py-20 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-center mb-12">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4"
                >
                    Seamless Connectivity
                </motion.p>
                <h2 className="text-3xl font-bold text-white">Works with your favorite tools</h2>
            </div>

            <div className="flex overflow-hidden group">
                <motion.div
                    animate={{ x: [0, -1920] }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="flex gap-6 whitespace-nowrap py-4"
                >
                    {displayIntegrations.map((item, idx) => (
                        <IntegrationIcon key={idx} {...item} />
                    ))}
                </motion.div>
                {/* Second clone for seamlessness */}
                <motion.div
                    animate={{ x: [0, -1920] }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="flex gap-6 whitespace-nowrap py-4"
                >
                    {displayIntegrations.map((item, idx) => (
                        <IntegrationIcon key={idx + 100} {...item} />
                    ))}
                </motion.div>
            </div>

            {/* Fade Gradients */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10" />
        </section>
    );
};

// ---- MAIN LANDING PAGE ----

const LandingPage = () => {
    const { scrollYProgress } = useScroll();
    const { trackEvent } = useAnalytics();
    const { formatAmount, getSymbol, convertAmount } = useCurrency();
    const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-emerald-500/30 font-sans">
            <Meta
                title="SubTrack - Smart SaaS Subscription Tracker for Developers"
                description="SubTrack helps developers detect unused cloud resources across all accounts on AWS, GitHub, and Vercel. Optimize your SaaS spend with AI-powered 'Savage' insights."
            />
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-emerald-500/10 blur-[120px]" />
                <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>

            {/* Antigravity Icons Layer */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none perspective-[1000px]">
                <FloatingIcon icon={Github} initialX={15} initialY={20} delay={0.1} depth={1.5} />
                <FloatingIcon icon={Server} initialX={80} initialY={15} delay={0.2} depth={1.2} />
                <FloatingIcon icon={Database} initialX={10} initialY={60} delay={0.3} depth={0.8} />
                <FloatingIcon icon={Cloud} initialX={85} initialY={70} delay={0.4} depth={1.4} />
                <FloatingIcon icon={Code2} initialX={50} initialY={40} delay={0.5} depth={0.5} />
                <FloatingIcon icon={Terminal} initialX={25} initialY={85} delay={0.6} depth={1.1} />
                <FloatingIcon icon={Zap} initialX={70} initialY={35} delay={0.7} depth={0.9} />
                <FloatingIcon icon={Globe} initialX={60} initialY={80} delay={0.8} depth={1.3} />
                <FloatingIcon icon={Cpu} initialX={35} initialY={15} delay={0.9} depth={1.0} />
            </div>

            {/* Navbar */}
            <Navbar />

            <main className="relative z-10 pt-24 md:pt-40 pb-12">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 text-center mb-20 md:mb-32 perspective-[1000px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, type: 'spring' }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-10 hover:bg-emerald-500/20 transition-colors cursor-default"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        Smart SaaS Subscription Tracker for Developers
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-10 leading-[0.9]"
                    >
                        Stop leaking <br />
                        <span className="sr-only">SaaS Costs and Cloud Credits</span>
                        <span className="inline-flex items-baseline gap-2 mt-2">
                            <span className="text-emerald-400 text-5xl md:text-7xl lg:text-8xl align-top">{getSymbol()}</span>
                            <OdometerNumber value={convertAmount(430 * 85)} delayOffset={0.5} />
                            <span className="text-4xl md:text-6xl lg:text-7xl text-emerald-400/80 font-light ml-2">/mo</span>
                        </span>
                    </motion.h1>

                    {/* Executive Summary for AI Extraction */}
                    <div className="sr-only">
                        <h2>SaaS and Infrastructure Cost Optimization Summary</h2>
                        <p>SubTrack is a developer-first SaaS tracker that automatically detects unused cloud resources across all your accounts and sub-accounts for 14+ providers including AWS, GCP, Azure, GitHub, Vercel, DigitalOcean, and OpenAI. It identifies 'Zombie' subscriptions and 'Shadow SaaS' through direct API integrations, helping startups save an average of {formatAmount(350 * 85)} per month on unattached elastic IPs, unused GitHub seats, and over-provisioned cloud instances.</p>
                    </div>


                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Automatically detect unused subscriptions, idle cloud resources, and forgotten developer tools.
                        <br />
                        Connect all your accounts across <span className="text-white font-semibold">14+ services</span> like AWS, GCP, Azure, GitHub & Vercel for instant insights.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link to="/sign-up">
                            <Button
                                size="lg"
                                className="h-16 px-10 text-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.6)] rounded-full transition-all hover:scale-105 active:scale-95"
                                onClick={() => trackEvent('sign_up_click', { location: 'hero' })}
                            >
                                Start Saving Free
                                <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 px-10 text-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/10"
                            onClick={() => (window as any).Supademo?.open('cmjmiy7hw53323zz213e9zkry')}
                        >
                            <Globe className="mr-2 w-6 h-6 text-emerald-400" />
                            Interactive Tour
                        </Button>
                    </motion.div>

                    <IntegrationsSection />

                    {/* Dashboard Preview with 3D Tilt Effect */}
                    <motion.div
                        style={{ y, rotateX: 15 }}
                        initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 15 }}
                        transition={{ duration: 1.2, delay: 0.4, type: "spring", bounce: 0.2 }}
                        className="mt-16 md:mt-32 relative mx-auto max-w-6xl group perspective-[2000px]"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.01]">
                            {/* Browser Chrome */}
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <div className="mx-auto flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-500">
                                    <Lock className="w-3 h-3" />
                                    subtrack.pulseguard.in
                                </div>
                            </div>

                            {/* Dashboard Content Mockup */}
                            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                <div className="col-span-2 space-y-4">
                                    <div className="flex items-center justify-between p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-red-500/30 transition-colors group/card">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                                                <Github className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">GitHub Pro</div>
                                                <div className="text-sm text-slate-400">Last active: 92 days ago</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-red-400 font-bold text-xl">{formatAmount(340)}/mo</div>
                                            <div className="text-xs font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded uppercase tracking-wider mt-1 inline-block">Zombie</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-amber-500/30 transition-colors group/card">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover/card:scale-110 transition-transform">
                                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M24 22.525H0l12-21.05 12 21.05z" /></svg>
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">Vercel Pro</div>
                                                <div className="text-sm text-slate-400">Bandwidth usage: 2%</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-amber-400 font-bold text-xl">{formatAmount(1600)}/mo</div>
                                            <div className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2 py-1 rounded uppercase tracking-wider mt-1 inline-block">Downgrade</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/5 blur-xl" />
                                    <div className="relative z-10">
                                        <div className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-4">Potential Savings</div>
                                        <div className="text-5xl font-black text-white mb-2 tracking-tight">{formatAmount(47200)}</div>
                                        <div className="text-sm text-emerald-400/60">per year</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Why SubTrack Section (Comparisons) */}
                <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-20">
                    <div className="text-center mb-10 md:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
                        >
                            Why SubTrack?
                        </motion.h2>
                        <p className="text-slate-400 text-xl max-w-3xl mx-auto">
                            Most SaaS managers are built for accountants.
                            SubTrack is built for <span className="text-white font-bold">developers</span> who care about their infrastructure.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            {[
                                {
                                    title: "Infrastructure-Aware Scanning",
                                    desc: "Unlike generic trackers, we don't just look at credit card statements. We connect to your GitHub, AWS, and Vercel APIs to check actual activity. If a repository has no commits for 90 days, we'll flag it."
                                },
                                {
                                    title: "Developer-First Ecosystem",
                                    desc: "Direct integrations with Linear, Sentry, Resend, and Clerk. We understand the developer stack like no one else, identifying overlaps between similar tools."
                                },
                                {
                                    title: "The 'Savage' Advantage",
                                    desc: "Our AI doesn't just suggest savings; it roasted your wasteful habits. Get blunt, actionable insights that actually help you cut costs instantly."
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-5">
                                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                                        <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="rounded-3xl border border-white/10 bg-slate-900/40 p-1 overflow-x-auto"
                        >
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="p-3 md:p-5 text-xs md:text-sm font-bold border-b border-white/10 uppercase tracking-widest text-slate-500">Feature</th>
                                        <th className="p-3 md:p-5 text-xs md:text-sm font-bold border-b border-white/10 uppercase tracking-widest text-emerald-400">SubTrack</th>
                                        <th className="p-3 md:p-5 text-xs md:text-sm font-bold border-b border-white/10 uppercase tracking-widest text-slate-500">Generic Managers</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    {[
                                        ["API Integrations", "GitHub/AWS/DigitalOcean", "Email/Bank Only"],
                                        ["Usage Analysis", "Commits/Deploys", "Price Paid Only"],
                                        ["Developer Stack", "Deep (Linear/Clerk)", "Non-existent"],
                                        ["AI Personality", "Savage Insights", "Boring Reports"],
                                        ["Setup Speed", "< 2 Minutes", "Weeks of Manual Work"]
                                    ].map((row, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 md:p-5 font-medium text-sm md:text-base">{row[0]}</td>
                                            <td className="p-3 md:p-5 font-bold text-emerald-400 text-sm md:text-base">{row[1]}</td>
                                            <td className="p-3 md:p-5 text-slate-500 text-sm md:text-base">{row[2]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-20">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Automated Subscription Audit",
                                desc: "Instantly scan your connected accounts to uncover dormant subscriptions, underutilized services, and billing redundancies.",
                                color: "text-yellow-400",
                                bg: "bg-yellow-400/10",
                                border: "border-yellow-400/20"
                            },
                            {
                                icon: Shield,
                                title: "Enterprise-Grade Security",
                                desc: "Read-only OAuth access with AES-256 encryption. Your code and infrastructure remain untouched—we only analyze usage patterns.",
                                color: "text-emerald-400",
                                bg: "bg-emerald-400/10",
                                border: "border-emerald-400/20"
                            },
                            {
                                icon: TrendingUp,
                                title: "AI-Powered Cost Insights",
                                desc: "Advanced AI analyzes your usage patterns to recommend smart downgrades, plan consolidations, and cost-saving opportunities.",
                                color: "text-blue-400",
                                bg: "bg-blue-400/10",
                                border: "border-blue-400/20"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: i * 0.1, duration: 0.6 }}
                                className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all group hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Pro Features Highlight */}
                <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-20">
                    <div className="text-center mb-12">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
                        >
                            Pro Features for <span className="text-emerald-400">Power Users</span>
                        </motion.h2>
                        <p className="text-slate-400 text-xl">Unlock advanced capabilities with SubTrack Pro</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Database,
                                title: "Multi-Account Support",
                                desc: "Connect 10+ accounts per service. Manage all your AWS, GitHub, and Vercel accounts in one place.",
                                color: "text-amber-400",
                                bg: "bg-amber-400/10",
                                border: "border-amber-400/20"
                            },
                            {
                                icon: MessageSquare,
                                title: "Slack Weekly Pulse",
                                desc: "Get AI-powered savings reports delivered to your team's Slack channel every week.",
                                color: "text-purple-400",
                                bg: "bg-purple-400/10",
                                border: "border-purple-400/20"
                            },
                            {
                                icon: Gift,
                                title: "Referral Rewards",
                                desc: "Earn free months of Pro by referring friends. They connect 3 services, you both win!",
                                color: "text-pink-400",
                                bg: "bg-pink-400/10",
                                border: "border-pink-400/20"
                            },
                            {
                                icon: BarChart3,
                                title: "Historical Trends",
                                desc: "Track your savings over time with beautiful charts. See your optimization progress.",
                                color: "text-cyan-400",
                                bg: "bg-cyan-400/10",
                                border: "border-cyan-400/20"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className={`p-6 rounded-2xl bg-slate-900/50 border ${feature.border} hover:border-opacity-60 transition-all group hover:-translate-y-1`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-4 ${feature.color}`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 md:py-24 text-center relative overflow-hidden z-20">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/10 to-transparent blur-3xl -z-10" />
                    <div className="max-w-4xl mx-auto px-6">
                        <motion.h2
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="text-5xl md:text-7xl font-bold mb-10 tracking-tight"
                        >
                            Start Saving on SaaS Today
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto"
                        >
                            Join thousands of developers and startups optimizing their software costs. Free setup in under 2 minutes.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Link to="/sign-up">
                                <Button
                                    size="lg"
                                    className="h-20 px-12 text-2xl bg-white text-slate-950 hover:bg-slate-200 rounded-full font-bold shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
                                    onClick={() => trackEvent('sign_up_click', { location: 'cta' })}
                                >
                                    Get Started for Free
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Natural Language FAQ Section (AEO Optimized) */}
                <section className="max-w-4xl mx-auto px-6 py-24 border-t border-white/5 relative z-20">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">SaaS FAQ</h2>
                        <p className="text-slate-400">Everything you need to know about SaaS and Cloud cost optimization.</p>
                    </div>

                    <div className="space-y-8">
                        {[
                            {
                                q: "How does SubTrack detect unused AWS resources?",
                                a: "SubTrack connects via read-only IAM credentials to scan for unattached Elastic IPs, unused EBS volumes, and dormant RDS instances that are still billing."
                            },
                            {
                                q: "Is SubTrack better than using a manual spreadsheet?",
                                a: "Yes. Unlike spreadsheets which require manual entry and become outdated instantly, SubTrack uses live API integrations to provide real-time visibility into your developer stack."
                            },
                            {
                                q: "Can I track OpenAI API costs with SubTrack?",
                                a: "Absolutely. SubTrack integrates with OpenAI to monitor your token usage and credit consumption across different projects and secondary accounts."
                            },
                            {
                                q: "How much can the average startup save with SubTrack?",
                                a: "Most startups identify between 15% and 30% in monthly savings by uncovering 'Shadow SaaS' and redundant worker processes within the first 48 hours."
                            },
                            {
                                q: "Which 14+ services does SubTrack support?",
                                a: "Currently, SubTrack supports direct API integrations with AWS, GCP, Azure, GitHub, Vercel, Linear, Sentry, Resend, Clerk, Stripe, OpenAI, DigitalOcean, Supabase, and Notion, with more being added monthly."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-slate-900/30 border border-white/5 hover:border-emerald-500/20 transition-all">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                                    {faq.q}
                                </h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
