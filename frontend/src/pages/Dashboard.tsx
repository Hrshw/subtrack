import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { Button } from '../components/ui/button';
import ConnectModal from '../components/ConnectModal';
import WaitlistModal from '../components/WaitlistModal';
import OnboardingModal from '../components/OnboardingModal';
import InsightsSection, { Leak, Connection } from '../components/InsightsSection';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
    AlertTriangle,
    Crown,
    Wallet,
    Link2,
    Search,
    TrendingUp,
    Zap,
    Plus,
    Shield,
    Settings as SettingsIcon,
    PieChart as PieChartIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RobotAssistant from '../components/RobotAssistant';
import { formatDistanceToNow } from 'date-fns';
import { ReferralCard } from '../components/ReferralCard';
import { Leaderboard } from '../components/Leaderboard';
import { SlackIntegrationCard } from '../components/SlackIntegrationCard';
import { ExportButton } from '../components/ExportButton';
import { AccountSwitcher } from '../components/AccountSwitcher';
import { useCurrency } from '../contexts/CurrencyContext';

// Extended interfaces to match backend data
interface ExtendedConnection extends Omit<Connection, 'lastScannedAt'> {
    lastScannedAt?: string;
    status: 'active' | 'error' | 'disconnected';
    metadata?: any;
    errorMessage?: string;
    // Multi-account fields
    accountLabel?: string;
    accountId?: string;
    isDefault?: boolean;
    environment?: 'production' | 'staging' | 'development' | 'other';
}

interface ExtendedLeak extends Leak {
    createdAt: string;
    rawData?: {
        lastCommitDate?: string;
        plan?: string;
        bandwidthUsage?: number;
        eventCount?: number;
        [key: string]: any;
    };
}

const Dashboard = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [profile, setProfile] = useState<any>(null);
    const { formatAmount, updateFromProfile } = useCurrency();
    const [connections, setConnections] = useState<ExtendedConnection[]>([]);
    const [leaks, setLeaks] = useState<ExtendedLeak[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasSeenBigSavings, setHasSeenBigSavings] = useState(false);
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
    const [dateFilter, setDateFilter] = useState('30'); // Days
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null); // Multi-account filter

    const subscriptionStatus = profile?.subscriptionStatus || 'free';
    const connectionLimit = subscriptionStatus === 'pro' ? Infinity : 5;

    const errorCount = useMemo(() => {
        return connections.filter(c => c.status === 'error').length;
    }, [connections]);

    const [trends, setTrends] = useState<any[]>([]);

    const fetchData = async () => {
        if (!isLoaded || !isSignedIn) return;

        try {
            const token = await getToken();
            if (!token) {
                console.log('No token available yet');
                return;
            }

            const apiUrl = getApiUrl();
            const [connRes, scanRes, userRes, trendsRes, summaryRes] = await Promise.all([
                axios.get(`${apiUrl}/connections`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/scan/results`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/analytics/trends`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/analytics/summary`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            // Ensure connections is an array
            const connectionsData = Array.isArray(connRes.data) ? connRes.data : [];
            setConnections(connectionsData);

            // Ensure leaks is an array
            const leaksData = Array.isArray(scanRes.data) ? scanRes.data : [];
            setLeaks(leaksData);

            setProfile(userRes.data);
            updateFromProfile(userRes.data); // Sync currency from profile
            setTrends(trendsRes.data);
            setSummary(summaryRes.data);

            // Determine last scan time from latest result
            if (leaksData.length > 0) {
                const dates = leaksData.map((l: ExtendedLeak) => new Date(l.createdAt).getTime());
                setLastScanTime(new Date(Math.max(...dates)));
            }
            if (connectionsData.length === 0 && !localStorage.getItem('hasSeenOnboarding')) {
                setShowOnboarding(true);
                localStorage.setItem('hasSeenOnboarding', 'true');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Don't show toast on 401s to avoid spamming while auth loads
            if (axios.isAxiosError(error) && error.response?.status !== 401) {
                toast.error('Failed to load data');
            }
        }
    };

    useEffect(() => {
        const fetchDataWithDelay = async () => {
            if (!isLoaded || !isSignedIn) return;

            // Add delay to ensure token is ready (1 second for better reliability)
            await new Promise(resolve => setTimeout(resolve, 1000));

            fetchData();
        };

        fetchDataWithDelay();
    }, [isLoaded, isSignedIn]);

    // Handle URL parameters for errors and success messages
    useEffect(() => {
        const error = searchParams.get('error');
        const success = searchParams.get('success');
        const connected = searchParams.get('connected');

        if (error) {
            let message = 'An error occurred';
            if (error === 'state_expired') message = 'Connection session expired. Please try again.';
            if (error === 'access_denied') message = 'Access denied by provider.';

            toast.error(message, {
                description: 'We couldn\'t complete the integration.',
                duration: 5000,
            });
            // Clean up URL
            navigate('/dashboard', { replace: true });
        }

        if (success || connected) {
            toast.success('Successfully connected!', {
                description: `Your ${connected || 'service'} is now being monitored.`,
                duration: 4000,
            });
            // Clean up URL
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams, navigate]);

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

    // --- FILTERED DATA ---
    const filteredConnections = useMemo(() => {
        if (!selectedConnectionId) return connections;
        return connections.filter(c => c.id === selectedConnectionId || (c as any)._id === selectedConnectionId);
    }, [connections, selectedConnectionId]);

    const filteredLeaks = useMemo(() => {
        if (!selectedConnectionId) return leaks;
        return leaks.filter(l => {
            const connId = typeof l.connectionId === 'object' ? l.connectionId._id : l.connectionId;
            return connId === selectedConnectionId;
        });
    }, [leaks, selectedConnectionId]);

    // --- DYNAMIC METRICS ---

    // 1. Total Savings (Real DB Data)
    const totalSavings = useMemo(() => filteredLeaks.reduce((acc, leak) => acc + (leak.potentialSavings || 0), 0), [filteredLeaks]);

    // 2. Active vs Leaks
    const activeResources = useMemo(() => filteredLeaks.filter(l => l.status === 'active'), [filteredLeaks]);
    const actualLeaks = useMemo(() => filteredLeaks.filter(l => l.status !== 'active'), [filteredLeaks]);
    const leakCount = actualLeaks.length;

    // 4. Chart Data (Dynamic)
    const timelineData = useMemo(() => {
        if (trends.length > 0 && !selectedConnectionId) {
            return trends.map(t => ({
                date: t.period,
                savings: t.savings,
                leaks: leakCount
            }));
        }

        // Fallback or specific account data
        const data = [];
        const today = new Date();
        const days = parseInt(dateFilter);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                savings: totalSavings,
                leaks: leakCount
            });
        }
        return data;
    }, [totalSavings, leakCount, trends, dateFilter, selectedConnectionId]);

    const categoryData = useMemo(() => {
        // Use backend-calculated category breakdown if available and No connection selected
        if (summary?.categoryBreakdown && !selectedConnectionId) {
            return Object.entries(summary.categoryBreakdown as Record<string, number>)
                .map(([name, value]) => ({ name, value }))
                .filter(item => item.value > 0)
                .sort((a, b) => b.value - a.value);
        }

        const categories: Record<string, number> = {};
        filteredLeaks.forEach(leak => {
            const type = leak.resourceType || 'Other';
            categories[type] = (categories[type] || 0) + (leak.potentialSavings || 0);
        });

        // If no savings, show active resource distribution
        if (Object.keys(categories).length === 0 && activeResources.length > 0) {
            activeResources.forEach(res => {
                const type = res.resourceType || 'Other';
                categories[type] = (categories[type] || 0) + 1;
            });
        }

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredLeaks, activeResources, summary, selectedConnectionId]);


    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

    // Upsell trigger removed by request
    useEffect(() => {
        // No-op
    }, []);

    const handleConnect = (provider: string) => {
        if (connections.length >= connectionLimit && subscriptionStatus === 'free') {
            navigate('/checkout');
            toast.error(`Free plan limit: ${connectionLimit} connections. Upgrade to Pro!`);
            return;
        }
        setSelectedProvider(provider);
    };

    const handleExportReport = async () => {
        const element = document.getElementById('dashboard-content');
        if (!element) return;

        toast.loading('Generating PDF report...', { id: 'pdf-export' });

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#0a0e17',
                ignoreElements: (element) => element.classList.contains('no-print')
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`subtrack-report-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report exported successfully!', { id: 'pdf-export' });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export report', { id: 'pdf-export' });
        }
    };

    // Helper to get connection status and last action
    const getConnectionInfo = (connId: string | undefined, providerName: string) => {
        const connection = connId
            ? connections.find(c => (c.id === connId || (c as any)._id === connId) && c.provider === providerName.toLowerCase())
            : connections.find(c => c.provider === providerName.toLowerCase());

        if (!connection) return { connected: false, lastAction: null, status: null };

        // Find associated scan results for THIS specific connection or all connections of THIS provider
        const providerLeaks = leaks.filter(l => {
            const lConnId = typeof l.connectionId === 'object' ? l.connectionId._id : l.connectionId;
            if (connId) return lConnId === connId || lConnId === (connection as any)._id;

            // If no specific connId, check if provider matches
            const lProvider = typeof l.connectionId === 'object' ? l.connectionId.provider : '';
            return lProvider === providerName.toLowerCase();
        });

        const hasLeaks = providerLeaks.some(l => l.status !== 'active');

        // Check if connection has error status
        if (connection.status === 'error') {
            return {
                connected: true,
                lastAction: 'Connection Error',
                status: 'error',
                savings: 0,
                errorMessage: connection.errorMessage
            };
        }

        // Try to find last activity from rawData
        let lastAction = 'Connected';
        const activeResult = providerLeaks.find(l => l.rawData?.lastCommitDate || l.rawData?.launchTime);

        if (activeResult?.rawData?.lastCommitDate || activeResult?.rawData?.launchTime) {
            try {
                const date = activeResult.rawData.lastCommitDate || activeResult.rawData.launchTime;
                // @ts-ignore
                lastAction = `Active ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
            } catch (e) {
                lastAction = 'Active recently';
            }
        } else if (connection.lastScannedAt) {
            // @ts-ignore
            lastAction = `Scanned ${formatDistanceToNow(new Date(connection.lastScannedAt), { addSuffix: true })}`;
        }

        return {
            connected: true,
            lastAction,
            status: hasLeaks ? 'leak' : 'optimal',
            savings: providerLeaks.reduce((acc, l) => acc + (l.potentialSavings || 0), 0),
            errorMessage: connection.errorMessage
        };
    };


    const providers = [
        { name: 'AWS', icon: '☁️', color: 'from-orange-600 to-orange-800', isReal: true, authType: 'manual' },
        { name: 'GitHub', icon: '🐙', color: 'from-gray-700 to-gray-900', isReal: true, authType: 'oauth' },
        { name: 'Vercel', icon: '▲', color: 'from-black to-gray-800', isReal: true, authType: 'oauth' },
        { name: 'Linear', icon: '📐', color: 'from-blue-600 to-blue-800', isReal: true, authType: 'oauth' },
        { name: 'Sentry', icon: '🔍', color: 'from-purple-600 to-purple-800', isReal: true, authType: 'oauth' },
        { name: 'Resend', icon: '📧', color: 'from-pink-600 to-pink-800', isReal: true, authType: 'api_key' },
        { name: 'Clerk', icon: '🔐', color: 'from-indigo-600 to-indigo-800', isReal: true, authType: 'api_key' },
        { name: 'Stripe', icon: '💳', color: 'from-violet-600 to-violet-800', isReal: true, authType: 'oauth' },
        { name: 'OpenAI', icon: '🤖', color: 'from-emerald-600 to-teal-800', isReal: true, authType: 'api_key' },
        { name: 'DigitalOcean', icon: '🌊', color: 'from-blue-500 to-blue-700', isReal: true, authType: 'api_key' },
        { name: 'Supabase', icon: '⚡', color: 'from-green-500 to-green-700', isReal: true, authType: 'api_key' },
        { name: 'Notion', icon: '📝', color: 'from-gray-600 to-gray-800', isReal: true, authType: 'api_key' },
        { name: 'GCP', icon: '🔷', color: 'from-blue-400 to-blue-600', isReal: false, authType: 'manual' },
        { name: 'Azure', icon: '🔵', color: 'from-sky-500 to-sky-700', isReal: false, authType: 'manual' }
    ];

    return (
        <div id="dashboard-content" className="min-h-screen bg-[#0a0e17] text-white relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none no-print">
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
                className="relative backdrop-blur-2xl bg-white/5 border-b border-white/10 sticky top-0 z-50 no-print"
            >
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo/logo-subTrack.jpg"
                            alt="SubTrack Logo"
                            className="h-10 w-auto rounded-lg"
                        />
                        <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 scale-90 sm:scale-100">
                            <Link
                                to="/dashboard"
                                className="px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all bg-emerald-500 text-slate-950"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/analytics"
                                className="px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all text-slate-400 hover:text-white"
                            >
                                Analytics
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {errorCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/20 transition-all group"
                                onClick={() => document.getElementById('connected-services')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                <AlertTriangle className="w-4 h-4 animate-pulse" />
                                <span className="text-xs font-bold tracking-tight">
                                    {errorCount} {errorCount === 1 ? 'service has' : 'services have'} errors
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
                            </motion.div>
                        )}

                        {subscriptionStatus === 'pro' ? (
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-2">
                                <Crown className="w-4 h-4" />
                                <span className="text-sm font-bold">PRO</span>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                                onClick={() => window.location.href = '/checkout'}
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade to Pro
                            </Button>
                        )}
                        <div className="h-8 w-[1px] bg-white/10 mx-2" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={() => window.location.href = '/settings'}
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </Button>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </motion.nav>

            <main className="max-w-[1400px] mx-auto px-6 py-8 pb-32 relative z-10">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                {(!profile?.name || profile.name === 'User') ? (user?.firstName || 'Developer') : profile.name}
                            </span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-base sm:text-lg italic sm:not-italic">Here's the latest status of your cloud infrastructure and subscriptions.</p>
                    </div>
                    {/* Multi-Account Switcher */}
                    {connections.length > 1 && (
                        <AccountSwitcher
                            connections={connections
                                .filter(c => c.id)
                                .map(c => ({
                                    id: c.id as string,
                                    provider: c.provider,
                                    accountLabel: c.accountLabel,
                                    isDefault: c.isDefault,
                                    environment: c.environment
                                }))}
                            selectedConnectionId={selectedConnectionId}
                            onSelect={setSelectedConnectionId}
                        />
                    )}
                </motion.div>

                {/* Hero Section - Dynamic */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Main Savings Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-between overflow-hidden hover:border-emerald-500/30 transition-colors duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wallet className="w-48 h-48" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-sm font-medium">
                                        {lastScanTime ? `Last scanned ${formatDistanceToNow(lastScanTime, { addSuffix: true })}` : 'Ready to scan'}
                                    </span>
                                </div>
                                <h2 className="text-base sm:text-lg text-gray-400">Total Potential Savings</h2>
                                <div className="text-4xl sm:text-6xl font-bold text-white mt-2 tracking-tight">
                                    {formatAmount(totalSavings * 12)}
                                    <span className="text-xl sm:text-2xl text-gray-500 font-normal ml-2">/year</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-8">
                                <Button
                                    size="lg"
                                    onClick={() => handleScan(true)}
                                    disabled={scanning}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 text-lg shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                                >
                                    {scanning ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Scanning...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Search className="w-5 h-5" />
                                            Scan Now
                                        </div>
                                    )}
                                </Button>
                                <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className={`h-12 border-white/10 hover:bg-white/5 transition-colors text-xs sm:text-sm ${subscriptionStatus !== 'pro' ? 'opacity-70 grayscale-[0.5]' : 'hover:text-emerald-400'}`}
                                        onClick={subscriptionStatus === 'pro' ? handleExportReport : () => navigate('/checkout')}
                                    >
                                        {subscriptionStatus === 'pro' ? <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> : <Crown className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-amber-500" />}
                                        <span className="truncate">Export PDF</span>
                                    </Button>
                                    <ExportButton />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Infrastructure Health - Merged Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#111827] backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Infrastructure health</h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm text-slate-400">Efficiency Score</span>
                                <span className={`font-bold text-lg ${(summary?.optimalityScore || 100) >= 90 ? 'text-emerald-400' : (summary?.optimalityScore || 100) >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {summary?.optimalityScore || 100}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${summary?.optimalityScore || 100}%` }}
                                    className={`h-full ${(summary?.optimalityScore || 100) >= 90 ? 'bg-emerald-500' : (summary?.optimalityScore || 100) >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                                <span className="text-2xl font-bold text-white">{filteredConnections.length}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Providers</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
                                <span className="text-2xl font-bold text-white">{leakCount}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Active Leaks</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Insights & Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Dynamic Insights Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <InsightsSection
                            leaks={filteredLeaks}
                            connections={filteredConnections.map(conn => ({
                                ...conn,
                                lastScannedAt: conn.lastScannedAt ? new Date(conn.lastScannedAt) : undefined
                            }))}
                            subscriptionStatus={subscriptionStatus}
                            lastScanTime={lastScanTime}
                        />

                        {/* Charts Section */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    Savings Trend
                                </h3>
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none focus:border-emerald-500/50 transition-colors"
                                >
                                    <option value="7">Last 7 Days</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="90">Last 3 Months</option>
                                </select>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData}>
                                        <defs>
                                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatAmount(value)} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [formatAmount(value), 'Savings']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="savings"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorSavings)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Health Status & Active Connections */}
                    <div className="space-y-8">
                        {/* Active Connections - Moved here for sidebar layout */}
                        <div id="active-connections-sidebar">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-400">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    Active connections
                                </h3>
                                {connections.length > 0 && (
                                    <Button
                                        onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="h-7 px-2 text-[10px] font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-600 border-0"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> NEW
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {filteredConnections.length > 0 ? (
                                    filteredConnections.map(conn => {
                                        const provider = providers.find(p => p.name.toLowerCase() === conn.provider.toLowerCase());
                                        const info = getConnectionInfo(conn.id || (conn as any)._id, conn.provider);
                                        return (
                                            <motion.div
                                                key={conn.id || (conn as any)._id}
                                                whileHover={{ x: 4 }}
                                                onClick={() => navigate(`/dashboard/service/${conn.id || (conn as any)._id}`)}
                                                className="bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-lg"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-xl p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-emerald-500/20 transition-all">
                                                            {provider?.icon || '⚙️'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors capitalize">{conn.provider}</h4>
                                                                {conn.accountLabel && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 truncate max-w-[80px]">
                                                                        {conn.accountLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <div className={`w-1 h-1 rounded-full ${info.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{info.status === 'optimal' ? 'Active' : (info.status || 'Active').toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-emerald-400 font-bold text-sm">{formatAmount(info.savings || 0)}</div>
                                                        <div className="text-[8px] text-slate-500 font-bold uppercase">Savings</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div
                                        onClick={() => setShowOnboarding(true)}
                                        className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all cursor-pointer group"
                                    >
                                        <Plus className="w-5 h-5 text-emerald-400 mb-2 opacity-50 group-hover:opacity-100" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connect first service</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Distribution Chart - Moved below active connections */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors duration-300">
                            <h3 className="text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                                <PieChartIcon className="w-4 h-4 text-blue-400" />
                                Savings by Category
                            </h3>
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '10px' }}
                                            formatter={(value: number) => [formatAmount(value), 'Savings']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-white">{categoryData.length}</div>
                                        <div className="text-[8px] text-gray-500 uppercase">Sources</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AWS Deep Scan Upsell for Free Users */}
                {subscriptionStatus === 'free' && connections.some(c => c.provider === 'aws') && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 to-blue-900/40 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                <Zap className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">Unlock Deep AWS Infrastructure Scan</h4>
                                <p className="text-blue-100/60 max-w-2xl text-sm leading-relaxed">
                                    Your Hobby plan currently only monitors <b>S3 Buckets</b> and <b>DynamoDB Tables</b>.
                                    Upgrade to <span className="text-amber-400 font-bold">Pro</span> to automatically detect zombies and downgrades in
                                    <b> EC2, RDS, Lambda, Elastic IPs, and EBS Volumes</b>.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/checkout')}
                            className="bg-white text-indigo-950 hover:bg-indigo-50 font-black px-8 h-12 rounded-xl shrink-0 shadow-xl shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                            <Crown className="w-4 h-4 mr-2 text-amber-500" />
                            Upgrade Now
                        </Button>
                    </motion.div>
                )}

                {/* Marketplace / Connect Grid */}
                <div className="mb-12 mt-12 bg-white/5 rounded-3xl p-8 border border-white/10" id="marketplace">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <Link2 className="w-7 h-7 text-emerald-400" />
                                Connect your services
                            </h3>
                            <p className="text-slate-500 mt-1">Select a service to start identifying cost optimizations and leaks.</p>
                        </div>
                        <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs text-slate-400">
                            {providers.filter(p => p.isReal).length} Integrations available
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {providers.flatMap((provider) => {
                            const providerConnections = connections.filter(c => c.provider === provider.name.toLowerCase());

                            if (providerConnections.length === 0) {
                                // Not connected yet
                                return (
                                    <motion.div
                                        key={provider.name}
                                        whileHover={{ y: -2 }}
                                        className={`relative group rounded-2xl border p-4 transition-all duration-300 ${provider.isReal
                                            ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10 opacity-80 hover:opacity-100'
                                            : 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${provider.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl filter drop-shadow-lg">{provider.icon}</div>
                                                <h4 className="text-base font-bold text-white">{provider.name}</h4>
                                            </div>
                                            <div className="relative group/btn">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={!provider.isReal}
                                                    className={`h-7 text-xs font-medium transition-all duration-300 relative z-10 ${provider.isReal
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white hover:scale-105 shadow-lg shadow-emerald-500/10'
                                                        : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                                                        }`}
                                                    onClick={(e) => {
                                                        if (!provider.isReal) return;
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleConnect(provider.name.toLowerCase());
                                                    }}
                                                >
                                                    {provider.isReal ? 'Connect' : 'Soon'}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                            {provider.isReal ? 'Connect to scan' : 'Coming soon'}
                                        </div>
                                    </motion.div>
                                );
                            }

                            // Render a card for each connection
                            return providerConnections.map((conn) => {
                                const info = getConnectionInfo(conn.id || (conn as any)._id, provider.name);
                                return (
                                    <motion.div
                                        key={conn.id || (conn as any)._id}
                                        whileHover={{ y: -2 }}
                                        className="relative group rounded-2xl border p-4 transition-all duration-300 bg-white/5 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${provider.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />

                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="text-2xl filter drop-shadow-lg">{provider.icon}</div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-white truncate">
                                                        {provider.name}
                                                    </h4>
                                                    {conn.accountLabel && (
                                                        <p className="text-[10px] text-emerald-400 font-medium truncate">
                                                            {conn.accountLabel}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.status === 'error'
                                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                    : info.status === 'optimal'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {info.status === 'error' ? 'ERROR' : info.status === 'optimal' ? 'OPTIMAL' : 'LEAK'}
                                                </div>
                                                {subscriptionStatus === 'pro' ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-full bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/50 transition-all duration-300 relative z-50 cursor-pointer pointer-events-auto flex items-center justify-center"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleConnect(provider.name.toLowerCase());
                                                        }}
                                                        title="Add your another account"
                                                    >
                                                        <Plus className="w-5 h-5 pointer-events-none" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 rounded-full bg-white/5 hover:bg-amber-500 hover:text-white text-amber-400 border border-white/10"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            navigate('/checkout');
                                                        }}
                                                        title="Unlock Multi-Account with Pro"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            {info.status === 'error' ? (
                                                <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mt-2">
                                                    <div className="flex items-center justify-between gap-1.5 text-red-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                                                        <div className="flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Error
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 p-1 text-[10px] bg-red-500/20 hover:bg-red-500/40"
                                                            onClick={() => handleConnect(provider.name.toLowerCase())}
                                                        >
                                                            Reconnect
                                                        </Button>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 leading-tight truncate">
                                                        {info.errorMessage || 'Invalid credentials'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Savings</span>
                                                        <span className="text-white font-medium">{formatAmount(info.savings || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Last Scan</span>
                                                        <span className="text-[10px] text-gray-500 truncate max-w-[100px]">{info.lastAction}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            });
                        })}
                    </div>
                </div>

                {/* Upgrade to Pro Banner */}
                {
                    subscriptionStatus === 'free' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-3xl p-8 flex items-center justify-between overflow-hidden mb-12"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Crown className="w-64 h-64 text-amber-500" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                                <h2 className="text-3xl font-bold text-white mb-4">Pro users save 4x more</h2>
                                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                    Based on your current usage, upgrading to Pro could save you an additional
                                    <span className="text-amber-400 font-bold mx-2 text-xl">{formatAmount((totalSavings * 4 || 20000) * 12)}</span>
                                    per year with automated monitoring and deep scans.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-105"
                                    onClick={() => window.location.href = '/checkout'}
                                >
                                    <Crown className="w-5 h-5 mr-2" />
                                    Unlock Pro Savings
                                </Button>
                            </div>
                        </motion.div>
                    )
                }

                {/* Growth Features Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    <ReferralCard />
                    <Leaderboard />
                    <SlackIntegrationCard />
                </div>
            </main>

            {/* Modals */}
            <ConnectModal
                isOpen={!!selectedProvider}
                onClose={() => setSelectedProvider(null)}
                provider={selectedProvider || ''}
                subscriptionStatus={subscriptionStatus}
                onConnected={() => {
                    setSelectedProvider(null);
                    handleScan(true);
                }}
            />
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
                    setSelectedProvider(provider.toLowerCase());
                }}
            />
            <div className="no-print">
                <RobotAssistant key={`${lastScanTime?.getTime() || 'initial'}-${connections.length}`} />
            </div>
        </div>
    );
};

export default Dashboard;
