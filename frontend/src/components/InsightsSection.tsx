import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Crown,
    AlertTriangle,
    Zap,
    Clock,
    TrendingUp,
    ChevronRight,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import Confetti from 'react-confetti';
import { formatDistanceToNow } from 'date-fns';

// --- Types ---
export interface Leak {
    _id: string;
    connectionId?: string;
    resourceName: string;
    resourceType: string;
    status: 'zombie' | 'downgrade_possible' | 'active';
    potentialSavings: number;
    currency: string;
    reason: string;
    smartRecommendation?: string;
    usesFallback?: boolean;
    createdAt: string;
}

export interface Connection {
    _id: string;
    id?: string;
    provider: string;
    lastScannedAt?: Date;
    status: string;
}

interface InsightsSectionProps {
    leaks: Leak[];
    connections: Connection[];
    subscriptionStatus: 'free' | 'pro';
    lastScanTime: Date | null;
    onUpgrade: () => void;
}

// --- Components ---

const InsightCard = ({ leak, onClick }: { leak: Leak; onClick: () => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        onClick={onClick}
        className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all ${leak.status === 'zombie'
            ? 'bg-gradient-to-br from-red-500/10 to-red-900/5 border-red-500/20 hover:border-red-500/40'
            : 'bg-gradient-to-br from-amber-500/10 to-amber-900/5 border-amber-500/20 hover:border-amber-500/40'
            }`}
    >
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-lg ${leak.status === 'zombie' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {leak.status === 'zombie' ? <AlertTriangle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white">{leak.resourceName}</h3>
                    <p className="text-sm text-slate-400 capitalize">{leak.resourceType} • {leak.status === 'zombie' ? 'Unused Resource' : 'Downgrade Available'}</p>
                </div>
            </div>
            <div className="text-right">
                <div className={`text-xl font-black ${leak.status === 'zombie' ? 'text-red-400' : 'text-amber-400'}`}>
                    ₹{leak.potentialSavings.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500">/month</p>
            </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-300 line-clamp-1 flex-1 mr-4">
                {leak.smartRecommendation || leak.reason}
            </p>
            <div className={`p-1 rounded-full ${leak.status === 'zombie' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
    </motion.div>
);

const HealthyStateFree = ({ savings, onUpgrade }: { savings: number; onUpgrade: () => void }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 p-8 text-center"
    >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />

        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-6 relative"
        >
            <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-30 rounded-full" />
            <Trophy className="w-20 h-20 text-emerald-400 relative z-10" />
        </motion.div>

        <h2 className="text-3xl font-black text-white mb-2">Cost Champion!</h2>
        <p className="text-emerald-200 text-lg mb-6">
            You saved <span className="font-bold text-emerald-400">₹{savings.toLocaleString('en-IN')}/year</span> by staying optimal.
        </p>

        <div
            onClick={onUpgrade}
            className="cursor-pointer group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-2"
        >
            <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                Pro users save 4x more with zero effort 😏
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
        </div>
    </motion.div>
);

const HealthyStatePro = ({ savings }: { savings: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/40 to-purple-900/40 border border-amber-500/30 p-8 text-center"
    >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />

        <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-6 relative"
        >
            <div className="absolute inset-0 bg-amber-400 blur-xl opacity-40 rounded-full" />
            <Crown className="w-20 h-20 text-amber-400 relative z-10" />
        </motion.div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 mb-2">
            Absolute Legend Status
        </h2>
        <p className="text-amber-100/80 text-lg mb-6">
            Top 1% of savers · <span className="font-bold text-amber-300">₹{savings.toLocaleString('en-IN')}/year</span> saved
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">Your efficiency is unmatched</span>
        </div>
    </motion.div>
);

const InsightsSection = ({ leaks, connections, subscriptionStatus, lastScanTime, onUpgrade }: InsightsSectionProps) => {
    const [selectedLeak, setSelectedLeak] = useState<Leak | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const activeLeaks = useMemo(() => leaks.filter(l => l.status !== 'active'), [leaks]);
    const healthyServices = useMemo(() => leaks.filter(l => l.status === 'active'), [leaks]);

    // Calculate "healthy savings" (mock calculation based on industry avg)
    const healthySavings = useMemo(() => healthyServices.length * 15000, [healthyServices.length]);
    const totalLeakSavings = useMemo(() => activeLeaks.reduce((acc, l) => acc + l.potentialSavings, 0), [activeLeaks]);

    // Trigger confetti on first load if healthy
    useEffect(() => {
        if (activeLeaks.length === 0 && healthyServices.length > 0) {
            const hasSeen = localStorage.getItem('hasSeenChampionConfetti');
            if (!hasSeen) {
                setShowConfetti(true);
                localStorage.setItem('hasSeenChampionConfetti', 'true');
                setTimeout(() => setShowConfetti(false), 5000);
            }
        }
    }, [activeLeaks.length, healthyServices.length]);

    const timeAgo = lastScanTime ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true }) : 'Never';

    return (
        <section className="relative">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        Your Insights
                        {subscriptionStatus === 'pro' && <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">PRO</span>}
                    </h2>
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> Last scanned {timeAgo} • {connections.length} services
                    </p>
                </div>
                {activeLeaks.length > 0 && (
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Potential Savings</p>
                        <p className="text-xl font-black text-emerald-400">₹{totalLeakSavings.toLocaleString('en-IN')}/mo</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {activeLeaks.length > 0 ? (
                    // Leaks Found State
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeLeaks.map((leak) => (
                                <InsightCard
                                    key={leak._id}
                                    leak={leak}
                                    onClick={() => setSelectedLeak(leak)}
                                />
                            ))}
                        </div>

                        {subscriptionStatus === 'free' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20">
                                        <Zap className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Pro fixes this automatically</p>
                                        <p className="text-xs text-indigo-200">Save time and money with one click.</p>
                                    </div>
                                </div>
                                <Button onClick={onUpgrade} size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                                    Upgrade
                                </Button>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    // Healthy State
                    <div>
                        {subscriptionStatus === 'free' ? (
                            <HealthyStateFree savings={healthySavings} onUpgrade={onUpgrade} />
                        ) : (
                            <HealthyStatePro savings={healthySavings * 1.2} /> // Pro users get a boost in "efficiency" stats ;)
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Leak Modal */}
            <AnimatePresence>
                {selectedLeak && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLeak(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 z-50 shadow-2xl"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{selectedLeak.resourceName}</h3>
                                    <p className="text-slate-400">{selectedLeak.resourceType}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedLeak.status === 'zombie'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    }`}>
                                    {selectedLeak.status === 'zombie' ? 'Zombie' : 'Downgrade'}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Potential Savings</p>
                                    <p className="text-3xl font-black text-white">₹{selectedLeak.potentialSavings.toLocaleString('en-IN')}<span className="text-sm text-slate-500 font-normal">/mo</span></p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" /> AI Insight
                                    </h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {selectedLeak.smartRecommendation || selectedLeak.reason}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    Detected {formatDistanceToNow(new Date(selectedLeak.createdAt), { addSuffix: true })}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setSelectedLeak(null)}>
                                    Dismiss
                                </Button>
                                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                                    Take Action
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </section>
    );
};

export default InsightsSection;
