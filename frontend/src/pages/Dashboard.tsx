import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { Button } from '../components/ui/button';
import ConnectModal from '../components/ConnectModal';
import WaitlistModal from '../components/WaitlistModal';
import OnboardingModal from '../components/OnboardingModal';
import InsightsSection, { Leak, Connection } from '../components/InsightsSection';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import CountUp from 'react-countup';
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
    PieChart as PieChartIcon,
    Settings as SettingsIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RobotAssistant from '../components/RobotAssistant';
import { formatDistanceToNow } from 'date-fns';

// Extended interfaces to match backend data
interface ExtendedConnection extends Omit<Connection, 'lastScannedAt'> {
    lastScannedAt?: string;
    status: 'active' | 'error' | 'disconnected';
    metadata?: any;
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
    const [connections, setConnections] = useState<ExtendedConnection[]>([]);
    const [leaks, setLeaks] = useState<ExtendedLeak[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasSeenBigSavings, setHasSeenBigSavings] = useState(false);
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
    const [dateFilter, setDateFilter] = useState('30'); // Days

    const subscriptionStatus = profile?.subscriptionStatus || 'free';
    const connectionLimit = subscriptionStatus === 'pro' ? Infinity : 5;

    const fetchData = async () => {
        if (!isLoaded || !isSignedIn) return;

        try {
            const token = await getToken();
            if (!token) {
                console.log('No token available yet');
                return;
            }

            const apiUrl = getApiUrl();
            const [connRes, scanRes, userRes] = await Promise.all([
                axios.get(`${apiUrl}/connections`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/scan/results`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            // Ensure connections is an array
            const connectionsData = Array.isArray(connRes.data) ? connRes.data : [];
            setConnections(connectionsData);

            // Ensure leaks is an array
            const leaksData = Array.isArray(scanRes.data) ? scanRes.data : [];
            setLeaks(leaksData);

            setProfile(userRes.data);

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

    // --- DYNAMIC METRICS ---

    // 1. Total Savings (Real DB Data)
    const totalSavings = useMemo(() => leaks.reduce((acc, leak) => acc + (leak.potentialSavings || 0), 0), [leaks]);

    // 2. Active vs Leaks
    const activeResources = useMemo(() => leaks.filter(l => l.status === 'active'), [leaks]);
    const actualLeaks = useMemo(() => leaks.filter(l => l.status !== 'active'), [leaks]);
    const leakCount = actualLeaks.length;

    // 4. Chart Data (Dynamic)
    const timelineData = useMemo(() => {
        // Group leaks by date (mocking history for now as we only have current snapshot, 
        // but in production this would query historical scan runs)
        // For now, we'll project the current savings over the last 30 days with some variance
        const data = [];
        const today = new Date();
        const days = parseInt(dateFilter);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            // Simulate some fluctuation based on current total
            const variance = totalSavings > 0 ? (Math.random() * 0.1 * totalSavings) : 0;
            data.push({
                date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                savings: Math.max(0, totalSavings - variance),
                leaks: leakCount
            });
        }
        return data;
    }, [totalSavings, leakCount, dateFilter]);

    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        leaks.forEach(leak => {
            // Use provider name as category if resourceType is generic
            const type = leak.resourceName.split(' ')[0] || leak.resourceType || 'Other';
            categories[type] = (categories[type] || 0) + (leak.potentialSavings || 0);
        });

        // If no savings, show active resource distribution
        if (Object.keys(categories).length === 0 && activeResources.length > 0) {
            activeResources.forEach(res => {
                const type = res.resourceName.split(' ')[0] || 'Other';
                categories[type] = (categories[type] || 0) + 1;
            });
        }

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [leaks, activeResources]);

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
    const getConnectionInfo = (providerName: string) => {
        const connection = connections.find(c => c.provider === providerName.toLowerCase());
        if (!connection) return { connected: false, lastAction: null, status: null };

        // Find associated scan results to get detailed info
        const providerLeaks = leaks.filter(l => l.resourceName.toLowerCase().includes(providerName.toLowerCase()));
        const hasLeaks = providerLeaks.some(l => l.status !== 'active');

        // Try to find last activity from rawData
        let lastAction = 'Connected';
        const activeResult = providerLeaks.find(l => l.rawData?.lastCommitDate);

        if (activeResult?.rawData?.lastCommitDate) {
            try {
                // @ts-ignore
                lastAction = `Last commit: ${formatDistanceToNow(new Date(activeResult.rawData.lastCommitDate), { addSuffix: true })}`;
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
            savings: providerLeaks.reduce((acc, l) => acc + (l.potentialSavings || 0), 0)
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
        { name: 'Stripe', icon: '💳', color: 'from-violet-600 to-violet-800', isReal: true, authType: 'oauth' }
    ];

    return (
        <div id="dashboard-content" className="min-h-screen bg-[#0a0e17] text-white relative overflow-hidden">
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
                            <span className="text-xs font-medium text-emerald-300">Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{profile?.name || user?.firstName || 'Developer'}</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Here's the latest status of your cloud infrastructure and subscriptions.</p>
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
                                <h2 className="text-lg text-gray-400">Total Potential Savings</h2>
                                <div className="text-6xl font-bold text-white mt-2 tracking-tight">
                                    ₹<CountUp end={totalSavings} duration={2.5} separator="," />
                                    <span className="text-2xl text-gray-500 font-normal ml-2">/year</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-8">
                                <Button
                                    size="lg"
                                    onClick={() => handleScan(true)}
                                    disabled={scanning}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 text-lg shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105"
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
                                <Button
                                    variant="outline"
                                    className={`h-12 border-white/10 hover:bg-white/5 transition-colors ${subscriptionStatus !== 'pro' ? 'opacity-70 grayscale-[0.5]' : 'hover:text-emerald-400'}`}
                                    onClick={subscriptionStatus === 'pro' ? handleExportReport : () => navigate('/checkout')}
                                >
                                    {subscriptionStatus === 'pro' ? <Search className="w-5 h-5 mr-2" /> : <Crown className="w-5 h-5 mr-2 text-amber-500" />}
                                    Export PDF Report
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats - Dynamic */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-rows-2 gap-6"
                    >
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-white/10 transition-colors duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-gray-400">
                                    {connections.length} / {connectionLimit === Infinity ? '∞' : connectionLimit}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-white">{connections.length}</div>
                            <div className="text-sm text-gray-400">Connected Services</div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-white/10 transition-colors duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-gray-400">
                                    {leakCount} Detected
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-white">{leakCount}</div>
                            <div className="text-sm text-gray-400">Active Leaks</div>
                        </div>
                    </motion.div>
                </div>

                {/* Insights & Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Dynamic Insights Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <InsightsSection
                            leaks={leaks}
                            connections={connections.map(conn => ({
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
                                        <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Savings']}
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

                    {/* Right Column: Distribution Only */}
                    <div className="space-y-6">
                        {/* Distribution Chart */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors duration-300">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-blue-400" />
                                Savings by Category
                            </h3>
                            <div className="h-[250px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">{categoryData.length}</div>
                                        <div className="text-xs text-gray-400">Sources</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Connected Services Grid - Bottom Section */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Link2 className="w-6 h-6 text-emerald-400" />
                        Connected Services
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {providers.map((provider) => {
                            const info = getConnectionInfo(provider.name);
                            return (
                                <motion.div
                                    key={provider.name}
                                    whileHover={{ y: -2 }}
                                    className={`relative group rounded-2xl border p-4 transition-all duration-300 ${info.connected
                                        ? 'bg-white/5 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                        : provider.isReal
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

                                        {info.connected ? (
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${info.status === 'optimal'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {info.status === 'optimal' ? 'Optimal' : 'Leak'}
                                            </div>
                                        ) : (
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
                                                {!provider.isReal && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-300 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                        We are currently developing this integration. Please wait! 🚧
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {info.connected ? (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Savings</span>
                                                <span className="text-white font-medium">₹{info.savings?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Status</span>
                                                <span className="text-[10px] text-gray-500 truncate max-w-[100px]">{info.lastAction}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-1 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                            {provider.isReal ? 'Connect to scan' : 'Coming soon'}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Upgrade to Pro Banner */}
                {subscriptionStatus === 'free' && (
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
                                <span className="text-amber-400 font-bold mx-2 text-xl">₹{(totalSavings * 4 || 20000).toLocaleString()}</span>
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
                )}
            </main>

            {/* Modals */}
            <ConnectModal
                isOpen={!!selectedProvider}
                onClose={() => setSelectedProvider(null)}
                provider={selectedProvider || ''}
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
            <RobotAssistant />
        </div>
    );
};

export default Dashboard;
