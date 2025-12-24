import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
    Lock
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

// ---- MAIN LANDING PAGE ----

const LandingPage = () => {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-emerald-500/30 font-sans">
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

            <main className="relative z-10 pt-40 pb-20">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 text-center mb-40 perspective-[1000px]">
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
                        <span className="inline-flex items-baseline gap-2 mt-2">
                            <span className="text-emerald-400 text-5xl md:text-7xl lg:text-8xl align-top">₹</span>
                            <OdometerNumber value={30000} delayOffset={0.5} />
                            <span className="text-4xl md:text-6xl lg:text-7xl text-emerald-400/80 font-light ml-2">/mo</span>
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Automatically detect unused subscriptions, idle cloud resources, and forgotten developer tools.
                        <br />
                        Connect <span className="text-white font-semibold">GitHub</span>, <span className="text-white font-semibold">Vercel</span> & <span className="text-white font-semibold">AWS</span> for instant cost insights.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link to="/sign-up">
                            <Button size="lg" className="h-16 px-10 text-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.6)] rounded-full transition-all hover:scale-105 active:scale-95">
                                Start Saving Free
                                <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                        </Link>
                        <Link to="/demo">
                            <Button size="lg" variant="outline" className="h-16 px-10 text-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full transition-all hover:scale-105 active:scale-95">
                                View Live Demo
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Dashboard Preview with 3D Tilt Effect */}
                    <motion.div
                        style={{ y, rotateX: 15 }}
                        initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 15 }}
                        transition={{ duration: 1.2, delay: 0.4, type: "spring", bounce: 0.2 }}
                        className="mt-32 relative mx-auto max-w-6xl group perspective-[2000px]"
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
                                    dashboard.subtrack.app
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
                                            <div className="text-red-400 font-bold text-xl">-₹340/mo</div>
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
                                            <div className="text-amber-400 font-bold text-xl">-₹1,600/mo</div>
                                            <div className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2 py-1 rounded uppercase tracking-wider mt-1 inline-block">Downgrade</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/5 blur-xl" />
                                    <div className="relative z-10">
                                        <div className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-4">Potential Savings</div>
                                        <div className="text-5xl font-black text-white mb-2 tracking-tight">₹47,200</div>
                                        <div className="text-sm text-emerald-400/60">per year</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Features Grid */}
                <section className="max-w-7xl mx-auto px-6 py-32 relative z-20">
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

                {/* CTA Section */}
                <section className="py-32 text-center relative overflow-hidden">
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
                                <Button size="lg" className="h-20 px-12 text-2xl bg-white text-slate-950 hover:bg-slate-200 rounded-full font-bold shadow-2xl hover:shadow-white/20 transition-all hover:scale-105">
                                    Get Started for Free
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
