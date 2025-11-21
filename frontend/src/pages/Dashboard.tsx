import { useEffect, useState, useMemo } from 'react';
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { Button } from '../components/ui/button';
import ConnectModal from '../components/ConnectModal';
import WaitlistModal from '../components/WaitlistModal';
import OnboardingModal from '../components/OnboardingModal';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import CountUp from 'react-countup';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
    CheckCircle2,
    Clock,
    Zap,
    AlertTriangle,
    Share2,
    Sparkles,
    Crown,
    Settings as SettingsIcon,
    Shield,
    Download,
    TrendingUp,
    Wallet,
    Link2,
    Award,
    Calendar,
    BarChart3,
    Bell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Connection {
    id: string;
    provider: string;
    lastScannedAt?: Date;
    status: string;
    metadata?: any;
}

interface Leak {
    _id: string;
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

const Dashboard = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [leaks, setLeaks] = useState<Leak[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeTab, setActiveTab] = useState<'leaks' | 'healthy' | 'timeline'>('leaks');
    const [hasSeenBigSavings, setHasSeenBigSavings] = useState(false);
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

    const subscriptionStatus = 'free' as 'free' | 'pro';
    const connectionLimit = subscriptionStatus === 'pro' ? Infinity : 5;

    const fetchData = async () => {
        try {
            const token = await getToken();
            const apiUrl = getApiUrl();
            const [connRes, scanRes] = await Promise.all([
                axios.get(`${apiUrl}/connections`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/scan/results`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setConnections(connRes.data);
            setLeaks(scanRes.data);

            if (connRes.data.length === 0 && !localStorage.getItem('hasSeenOnboarding')) {
                setShowOnboarding(true);
                localStorage.setItem('hasSeenOnboarding', 'true');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleScan = async (forceRefresh = false) => {
        setScanning(true);
        toast.loading(forceRefresh ? 'Force refreshing all services...' : 'Scanning for savings...', { id: 'scan' });
        try {
            const token = await getToken();
            const apiUrl = getApiUrl();
            const response = await axios.post(
                `${apiUrl}/scan/trigger`,
                { forceRefresh },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLastScanTime(new Date());
            await fetchData();

            if (response.data.cached) {
                toast.success('Scan complete! Using recent results', { id: 'scan' });
            } else {
                toast.success(`✨ Scanned ${response.data.scannedCount || response.data.data.length} services successfully!`, { id: 'scan' });
            }
        } catch (error) {
            console.error('Scan failed:', error);
            toast.error('Scan failed. Please try again.', { id: 'scan' });
        } finally {
            setScanning(false);
        }
    };

    // Calculated metrics
    const totalSavings = useMemo(() => leaks.reduce((acc, leak) => acc + (leak.potentialSavings || 0), 0), [leaks]);
    const activeResources = useMemo(() => leaks.filter(l => l.status === 'active'), [leaks]);
    const actualLeaks = useMemo(() => leaks.filter(l => l.status !== 'active'), [leaks]);

    // Calculate "saved" amount for healthy services (what they're NOT paying)
    const healthySavings = useMemo(() => {
        return activeResources.length * 15000; // Avg ₹15k/year per service by using free/optimal plan
    }, [activeResources.length]);

    const avgSavingsPerService = useMemo(() => {
        return connections.length > 0 ? Math.round(totalSavings / connections.length) : 0;
    }, [totalSavings, connections.length]);

    // Generate mock timeline data (last 30 days)
    const timelineData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                savings: totalSavings + (Math.random() - 0.5) * 5000,
                leaks: actualLeaks.length + Math.floor((Math.random() - 0.5) * 2)
            });
        }
        return data;
    }, [totalSavings, actualLeaks.length]);

    // Smart default tab
    useEffect(() => {
        if (leaks.length > 0) {
            if (actualLeaks.length === 0 && activeResources.length > 0) {
                setActiveTab('healthy');
            } else if (actualLeaks.length > 0) {
                setActiveTab('leaks');
            }
        }
    }, [leaks.length, actualLeaks.length, activeResources.length]);

    // Confetti + Sound for big savings
    useEffect(() => {
        if (totalSavings > 50000 && !hasSeenBigSavings) {
            setShowConfetti(true);
            setHasSeenBigSavings(true);
            setTimeout(() => {
                setShowConfetti(false);
            }, 5000);
        }
    }, [totalSavings, hasSeenBigSavings]);

    // Upsell trigger
    useEffect(() => {
        if (totalSavings > 10000 && subscriptionStatus === 'free' && actualLeaks.length > 0) {
            setTimeout(() => setShowUpgradeModal(true), 3000);
        }
    }, [totalSavings, subscriptionStatus, actualLeaks.length]);

    const providers = [
        { name: 'GitHub', icon: '🐙', avgSavings: 18000, color: 'from-gray-700 to-gray-900' },
        { name: 'Vercel', icon: '▲', avgSavings: 25000, color: 'from-black to-gray-800' },
        { name: 'AWS', icon: '☁️', avgSavings: 45000, color: 'from-orange-600 to-orange-800' },
        { name: 'Sentry', icon: '🔍', avgSavings: 12000, color: 'from-purple-600 to-purple-800' },
        { name: 'Linear', icon: '📐', avgSavings: 8000, color: 'from-blue-600 to-blue-800' },
        { name: 'Resend', icon: '📧', avgSavings: 6000, color: 'from-pink-600 to-pink-800' },
        { name: 'Clerk', icon: '🔐', avgSavings: 15000, color: 'from-indigo-600 to-indigo-800' },
        { name: 'Stripe', icon: '💳', avgSavings: 20000, color: 'from-violet-600 to-violet-800' }
    ];

    const handleConnect = (provider: string) => {
        if (connections.length >= connectionLimit && subscriptionStatus === 'free') {
            setShowUpgradeModal(true);
            toast.error(`Free plan limit: ${connectionLimit} connections. Upgrade to Pro!`);
            return;
        }
        setSelectedProvider(provider);
    };

    const exportToCSV = () => {
        const headers = ['Service', 'Type', 'Status', 'Monthly Savings (INR)', 'Recommendation'];
        const rows = leaks.map(leak => [
            leak.resourceName,
            leak.resourceType,
            leak.status,
            leak.potentialSavings,
            leak.smartRecommendation || leak.reason
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `subtrack-savings-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast.success('Report exported successfully!');
    };

    const shareToTwitter = () => {
        const text = `Just discovered ₹${totalSavings.toLocaleString('en-IN')}/month in subscription waste with @SubTrackApp 🤯 Already optimized ${activeResources.length} services!`;
        const url = 'https://subtrack.app';
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#0a0e17] text-white relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <Toaster position="top-right" theme="dark" />
            {showConfetti && <Confetti recycle={false} numberOfPieces={800} />}

            {/* Header */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="relative backdrop-blur-2xl bg-white/5 border-b border-white/10 sticky top-0 z-50"
            >
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo/logo-subTrack.jpg"
                            alt="SubTrack Logo"
                            className="h-10 w-auto rounded-lg"
                        />
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-300">Premium Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {subscriptionStatus === 'pro' ? (
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-2">
                                <Crown className="w-4 h-4" />
                                <span className="text-sm font-bold">Pro • ₹799</span>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setShowUpgradeModal(true)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-semibold shadow-lg shadow-emerald-500/30"
                            >
                                <Bell className="w-4 h-4 mr-2" />
                                Pro Launching Soon
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.location.href = '/settings'}
                            className="hover:bg-white/10"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </Button>

                        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                            <span className="text-sm text-slate-300 hidden md:block font-medium">
                                {user?.firstName || 'User'}
                            </span>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </motion.nav>

            <main className="relative max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <div className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />

                        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h1 className="text-4xl lg:text-5xl font-black">
                                        <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                            ₹<CountUp end={totalSavings} duration={2.5} separator="," />
                                        </span>
                                    </h1>
                                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                        <span className="text-sm font-bold text-emerald-300">/month</span>
                                    </div>
                                </div>
                                <p className="text-lg text-slate-300 font-medium mb-4">
                                    Potential Monthly Savings Discovered
                                </p>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {lastScanTime && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Clock className="w-4 h-4" />
                                            Last scanned {new Date(lastScanTime).toLocaleTimeString()}
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={shareToTwitter}
                                        className="border-white/20 hover:bg-white/10"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share on X
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={exportToCSV}
                                        className="border-white/20 hover:bg-white/10"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <Button
                                    onClick={() => handleScan()}
                                    disabled={scanning || connections.length === 0}
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl shadow-emerald-500/30 font-bold px-8"
                                >
                                    {scanning ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5 mr-2" />
                                            Scan Now
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-slate-400">
                                    {connections.length} {connections.length === 1 ? 'service' : 'services'} connected
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Quick Stats Grid */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {/* Total Connected */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:scale-110 transition-transform">
                                <Link2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-white">{connections.length}</div>
                                <p className="text-xs text-slate-400 mt-1">Connected</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-300">Total Services</p>
                    </motion.div>

                    {/* Monthly Waste */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-red-500/30 group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-red-400">{actualLeaks.length}</div>
                                <p className="text-xs text-slate-400 mt-1">Issues</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-300">Active Leaks</p>
                    </motion.div>

                    {/* Avg Savings */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                                <Wallet className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-emerald-400">₹{avgSavingsPerService.toLocaleString()}</div>
                                <p className="text-xs text-slate-400 mt-1">per service</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-300">Avg Savings</p>
                    </motion.div>

                    {/* Healthy Services */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-emerald-400">{activeResources.length}</div>
                                <p className="text-xs text-slate-400 mt-1">Optimized</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-300">Healthy Services</p>
                    </motion.div>
                </motion.section>

                {/* Insights Tabs */}
                {(actualLeaks.length > 0 || activeResources.length > 0) && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Tab Headers */}
                        <div className="border-b border-white/10 px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black mb-1">Your Insights</h2>
                                    <p className="text-sm text-slate-400">
                                        {actualLeaks.length > 0
                                            ? `${actualLeaks.length} optimization opportunities found`
                                            : 'All systems optimized 🎉'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {actualLeaks.length > 0 && (
                                        <button
                                            onClick={() => setActiveTab('leaks')}
                                            className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'leaks'
                                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                }`}
                                        >
                                            🚨 Issues ({actualLeaks.length})
                                        </button>
                                    )}
                                    {activeResources.length > 0 && (
                                        <button
                                            onClick={() => setActiveTab('healthy')}
                                            className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'healthy'
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                }`}
                                        >
                                            ✅ Healthy ({activeResources.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveTab('timeline')}
                                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'timeline'
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <BarChart3 className="w-4 h-4 inline mr-1" />
                                        Timeline
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {/* Active Leaks Tab */}
                                {activeTab === 'leaks' && (
                                    <motion.div
                                        key="leaks"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-3"
                                    >
                                        {actualLeaks.map((leak, idx) => (
                                            <motion.div
                                                key={leak._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/3 border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-all group"
                                            >
                                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${leak.status === 'zombie' ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                                                                }`} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <h3 className="font-black text-xl">{leak.resourceName}</h3>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${leak.status === 'zombie'
                                                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                        }`}>
                                                                        {leak.status === 'zombie' ? '🧟 Zombie' : '📉 Downgrade'}
                                                                    </span>
                                                                    {leak.smartRecommendation && !leak.usesFallback && (
                                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                                                                            <Sparkles className="w-3 h-3 text-purple-300" />
                                                                            <span className="text-xs font-semibold text-purple-300">AI</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-400 capitalize">{leak.resourceType}</p>
                                                            </div>
                                                        </div>

                                                        <div className="pl-6">
                                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                                {leak.smartRecommendation || leak.reason}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 pl-6 lg:pl-0">
                                                        <div className="text-right">
                                                            <div className={`text-4xl font-black ${leak.status === 'zombie' ? 'text-red-400' : 'text-amber-400'
                                                                }`}>
                                                                ₹{leak.potentialSavings.toLocaleString('en-IN')}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">per month</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className={`${leak.status === 'zombie'
                                                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                                                                : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                                                } font-bold`}
                                                        >
                                                            {leak.status === 'zombie' ? 'Cancel' : 'Optimize'} →
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Healthy Wins Tab */}
                                {activeTab === 'healthy' && (
                                    <motion.div
                                        key="healthy"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {/* Celebration Header */}
                                        <div className="text-center py-8">
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-7xl mb-4"
                                            >
                                                🏆
                                            </motion.div>
                                            <h3 className="text-3xl font-black mb-2">You're a Cost Champion!</h3>
                                            <p className="text-slate-300 text-lg mb-4">
                                                {activeResources.length} {activeResources.length === 1 ? 'service' : 'services'} running on optimal plans
                                            </p>
                                            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                                                <Award className="w-5 h-5 text-emerald-400" />
                                                <span className="text-lg font-bold text-emerald-300">
                                                    Saved ₹{healthySavings.toLocaleString('en-IN')}/year by staying optimal
                                                </span>
                                            </div>
                                        </div>

                                        {activeResources.map((resource, idx) => (
                                            <motion.div
                                                key={resource._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                whileHover={{ scale: 1.01 }}
                                                className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-white/5 border border-emerald-500/20 rounded-2xl p-6"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="w-4 h-4 rounded-full bg-emerald-500"
                                                        />
                                                        <div>
                                                            <h4 className="font-black text-xl mb-1">{resource.resourceName}</h4>
                                                            <p className="text-sm text-emerald-300 font-semibold">
                                                                ✨ {resource.smartRecommendation || resource.reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-black text-emerald-400">✅ Optimal</div>
                                                        <p className="text-xs text-slate-400">Keep it up!</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Timeline Tab */}
                                {activeTab === 'timeline' && (
                                    <motion.div
                                        key="timeline"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h3 className="text-xl font-black mb-2">Savings Over Time</h3>
                                            <p className="text-sm text-slate-400">Your optimization journey (last 30 days)</p>
                                        </div>

                                        <div className="h-80 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={timelineData}>
                                                    <defs>
                                                        <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#94a3b8"
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        stroke="#94a3b8"
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#1e293b',
                                                            border: '1px solid #334155',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="savings"
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#savingsGradient)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                    <p className="text-sm text-slate-400">Projected Yearly</p>
                                                </div>
                                                <p className="text-3xl font-black text-emerald-400">
                                                    ₹{(totalSavings * 12).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="w-5 h-5 text-blue-400" />
                                                    <p className="text-sm text-slate-400">Total Scans</p>
                                                </div>
                                                <p className="text-3xl font-black text-blue-400">{leaks.length}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.section>
                )}

                {/* Connected Services */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black mb-1">Connected Services</h2>
                            <p className="text-sm text-slate-400">
                                {connections.length === 0
                                    ? 'Connect your dev tools to start finding savings'
                                    : `${connections.length} ${connections.length === 1 ? 'service' : 'services'} connected`}
                                {subscriptionStatus === 'free' && connections.length > 0 && ` • ${connectionLimit - connections.length} slots remaining`}
                            </p>
                        </div>
                    </div>

                    {connections.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl"
                        >
                            <div className="text-7xl mb-6">💸</div>
                            <h3 className="text-3xl font-black mb-3">Start Saving Money Today</h3>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                Connect your first service and discover hidden savings in under 60 seconds
                            </p>
                            <Button
                                size="lg"
                                onClick={() => setShowOnboarding(true)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8 font-bold"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                Connect Your First Service
                            </Button>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {providers.map((provider, idx) => {
                            const isConnected = connections.some(c => c.provider.toLowerCase() === provider.name.toLowerCase());
                            const connection = connections.find(c => c.provider.toLowerCase() === provider.name.toLowerCase());

                            return (
                                <motion.div
                                    key={provider.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ scale: 1.05, y: -4 }}
                                >
                                    <div className={`backdrop-blur-xl border rounded-2xl p-5 h-full transition-all ${isConnected
                                        ? 'bg-gradient-to-br from-emerald-500/10 to-white/5 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-3xl shadow-lg`}>
                                                {provider.icon}
                                            </div>
                                            {isConnected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring' }}
                                                >
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                </motion.div>
                                            )}
                                        </div>

                                        <h3 className="font-black text-lg mb-3">{provider.name}</h3>

                                        {isConnected ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                                    <Clock className="w-3 h-3" />
                                                    Scanned {connection?.lastScannedAt ? new Date(connection.lastScannedAt).toLocaleDateString() : 'recently'}
                                                </div>
                                                <div className="px-3 py-2 bg-emerald-500/10 rounded-lg text-xs text-emerald-400 font-bold text-center border border-emerald-500/20">
                                                    ✓ Connected
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-400">
                                                    Avg savings: <span className="font-bold text-emerald-400">₹{provider.avgSavings.toLocaleString('en-IN')}/yr</span>
                                                </p>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleConnect(provider.name)}
                                                    className="w-full bg-white/10 hover:bg-emerald-600 border border-white/20 hover:border-emerald-500 font-semibold"
                                                >
                                                    Connect
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Trust Footer */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="py-8 border-t border-white/10"
                >
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Read-only access
                        </div>
                        <div className="hidden md:block">•</div>
                        <div>Bank-level encryption</div>
                        <div className="hidden md:block">•</div>
                        <div>Revoke anytime</div>
                        <div className="hidden md:block">•</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-300 font-semibold">Powered by Gemini AI</span>
                        </div>
                    </div>
                </motion.section>
            </main>

            {/* Modals */}
            {selectedProvider && (
                <ConnectModal
                    isOpen={!!selectedProvider}
                    onClose={() => setSelectedProvider(null)}
                    provider={selectedProvider}
                    onConnected={() => {
                        setSelectedProvider(null);
                        fetchData();
                        handleScan(); // Auto-scan new connection
                        toast.success(`${selectedProvider} connected! Scanning now...`);
                    }}
                />
            )}

            <WaitlistModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                potentialSavings={totalSavings}
            />

            <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onComplete={(provider) => {
                    setShowOnboarding(false);
                    setSelectedProvider(provider);
                }}
            />
        </div>
    );
};

export default Dashboard;
