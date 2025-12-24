import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Crown,
    AlertTriangle,
    Clock,
    TrendingUp,
    ChevronRight,
    Sparkles,
    Zap
} from 'lucide-react';
import { Button } from './ui/button';
import Confetti from 'react-confetti';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
    rawData?: any;
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
}

// --- Components ---

const cleanAIResponse = (text: string) => {
    if (!text) return "";
    // Remove all common LLM tokens and artifacts
    return text
        .replace(/\[\/?B_INST\]/g, '')      // Llama [B_INST] and [/B_INST]
        .replace(/\[\/?INST\]/g, '')        // [INST] and [/INST]
        .replace(/\[\/?s\]/g, '')           // [s] and [/s] sequence tokens
        .replace(/<\/?s>/g, '')             // <s> and </s> alternative format
        .replace(/\[\/?\w+\]/g, '')         // Any other bracket tokens like [SYS], [/SYS]
        .trim();
};

const InsightCard = ({ leak, onClick }: { leak: Leak; onClick: () => void }) => {
    const getUsageText = () => {
        if (leak.resourceType === 'S3 Bucket' && leak.rawData?.lastModified) {
            try {
                return `Last Active: ${formatDistanceToNow(new Date(leak.rawData.lastModified), { addSuffix: true })}`;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const usageText = getUsageText();

    return (
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
                        <p className="text-sm text-slate-400 capitalize flex items-center gap-2">
                            {leak.resourceType} • {leak.status === 'zombie' ? 'Unused Resource' : 'Downgrade Available'}
                            {usageText && (
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                                    {usageText}
                                </span>
                            )}
                        </p>
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
                    {cleanAIResponse(leak.smartRecommendation || leak.reason)}
                </p>
                <div className={`p-1 rounded-full ${leak.status === 'zombie' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </motion.div>
    );
};

const HealthyStateFree = ({ savings }: { savings: number }) => {
    const navigate = useNavigate();
    return (
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
                onClick={() => navigate('/checkout')}
                className="cursor-pointer group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-2"
            >
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                    Pro users save 4x more with zero effort 😏
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </div>
        </motion.div>
    );
};

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

const AIResponseRenderer = ({ text }: { text: string }) => {
    if (!text) return null;

    // 1. Remove artifacts like [/B_INST]
    let clean = cleanAIResponse(text);

    // 2. Format the text - escape HTML first, then apply formatting
    const formatText = (str: string) => {
        // First, escape HTML entities to prevent XSS and rendering issues
        let formatted = str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Now apply our custom formatting (safe since we escaped HTML)
        // Replace **text** with bold spans (using &ast; for asterisks to avoid confusion)
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

        // Inject line breaks before numbered lists for better readability
        formatted = formatted.replace(/(\s)(\d+\.\s)/g, '$1<br/><br/>$2');

        // Handle newlines
        formatted = formatted.replace(/\n/g, '<br/>');

        return formatted;
    };

    return (
        <div
            className="text-slate-300 text-sm leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: formatText(clean) }}
        />
    );
};

const InsightsSection = ({ leaks, connections, subscriptionStatus, lastScanTime }: InsightsSectionProps) => {
    const [activeTab, setActiveTab] = useState<'action_required' | 'healthy'>('action_required');
    const [selectedLeak, setSelectedLeak] = useState<Leak | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const navigate = useNavigate();

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

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            Your Insights
                            {subscriptionStatus === 'pro' && <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">PRO</span>}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> Last scanned {timeAgo} • {connections.length} services
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-800/50 rounded-lg border border-white/5">
                    <button
                        onClick={() => setActiveTab('action_required')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'action_required'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Action Required
                        {activeLeaks.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                                {activeLeaks.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('healthy')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'healthy'
                            ? 'bg-emerald-900/30 text-emerald-400 shadow-sm border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Healthy Resources
                        {healthyServices.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                                {healthyServices.length}
                            </span>
                        )}
                    </button>
                </div>

                {activeLeaks.length > 0 && activeTab === 'action_required' && (
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-slate-400">Potential Savings</p>
                        <p className="text-xl font-black text-emerald-400">₹{totalLeakSavings.toLocaleString('en-IN')}/mo</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {activeTab === 'action_required' ? (
                    activeLeaks.length > 0 ? (
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
                                    <Button onClick={() => navigate('/checkout')} size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                                        Upgrade
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        // Healthy State (Empty State for Action Required)
                        <div>
                            {subscriptionStatus === 'free' ? (
                                <HealthyStateFree savings={healthySavings} />
                            ) : (
                                <HealthyStatePro savings={healthySavings * 1.2} />
                            )}
                        </div>
                    )
                ) : (
                    // Healthy Resources Tab Content
                    <div className="space-y-6">
                        {healthyServices.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {healthyServices.map((resource) => (
                                    <motion.div
                                        key={resource._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative overflow-hidden rounded-2xl border p-5 transition-all bg-gradient-to-br from-emerald-500/5 to-emerald-900/5 border-emerald-500/20 hover:border-emerald-500/40"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{resource.resourceName}</h3>
                                                    <p className="text-sm text-slate-400 capitalize">{resource.resourceType} • Optimized</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    HEALTHY
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-sm text-slate-300">
                                                {cleanAIResponse(resource.reason)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-slate-400">No healthy resources found yet. Connect more services!</p>
                            </div>
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
                            className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 z-[60] shadow-2xl max-h-[92vh] overflow-y-auto"
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
                                    <AIResponseRenderer text={selectedLeak.smartRecommendation || selectedLeak.reason} />
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
                                <Button
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                                    onClick={() => {
                                        const connId = typeof selectedLeak.connectionId === 'object'
                                            ? (selectedLeak.connectionId as any)._id
                                            : selectedLeak.connectionId;

                                        if (connId) {
                                            navigate(`/dashboard/service/${connId}`);
                                        } else {
                                            // Fallback if no connectionId, though it should exist
                                            console.warn('No connectionId found for leak', selectedLeak);
                                        }
                                        setSelectedLeak(null);
                                    }}
                                >
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
