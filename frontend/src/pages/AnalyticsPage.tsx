import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Zap,
    Target,
    Wallet,
    ArrowUpRight,
    PieChart as PieChartIcon,
    BarChart3,
    Activity,
    AlertTriangle,
    Settings as SettingsIcon,
    Layers,
    Clock,
    MousePointer2,
    RefreshCw
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    ComposedChart,
    Line,
    Area
} from 'recharts';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';

const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

const AnalyticsPage = () => {
    const { getToken } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [predicting, setPredicting] = useState(false);
    const { formatAmount, convertAmount } = useCurrency();

    const fetchAnalytics = async () => {
        setLoading(true);
        setPredicting(true);
        try {
            const token = await getToken();
            const apiUrl = getApiUrl();

            const [summaryRes, trendsRes, forecastRes] = await Promise.all([
                axios.get(`${apiUrl}/analytics/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/analytics/trends`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/analytics/forecast`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setSummary(summaryRes.data);
            setTrends(trendsRes.data);
            setForecast(forecastRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
            // Artificial delay for prediction animation feel
            setTimeout(() => setPredicting(false), 2000);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [getToken]);

    const pieData = useMemo(() => {
        if (!summary?.breakdown) return [];
        return Object.entries(summary.breakdown).map(([name, data]: [string, any]) => ({
            name: name.toUpperCase(),
            value: data.cost || 0
        })).filter(d => d.value > 0);
    }, [summary]);

    const stats = useMemo(() => [
        {
            label: 'Total spend',
            value: summary?.totalCurrentSpend || 0,
            icon: Wallet,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            trend: summary?.trendPercentage || 0,
            desc: `vs last month`
        },
        {
            label: 'Detected leakage',
            value: summary?.totalSavings || 0,
            icon: Zap,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            trend: null,
            desc: 'Recoverable waste found'
        },
        {
            label: 'Operational rating',
            value: summary?.optimalityScore || 0,
            unit: '%',
            icon: Target,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            trend: null,
            desc: 'System-wide health'
        }
    ], [summary]);

    if (loading && !summary) {
        return (
            <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Analyzing operational metrics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0e17] text-white overflow-x-hidden">
            {/* Header */}
            <motion.nav className="relative backdrop-blur-2xl bg-white/5 border-b border-white/10 sticky top-0 z-50 mb-8">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src="/logo/logo-subTrack.jpg" alt="SubTrack" className="h-10 w-auto rounded-lg" />
                        <div className="hidden md:flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
                            <Link to="/dashboard" className="px-4 py-1.5 rounded-full text-xs font-bold transition-all text-slate-400 hover:text-white">Dashboard</Link>
                            <Link to="/analytics" className="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-emerald-500 text-slate-950">Analytics</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10" onClick={() => window.location.href = '/settings'}><SettingsIcon className="w-5 h-5" /></Button>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </motion.nav>

            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Cost Intelligence</h1>
                        <p className="text-slate-400 mt-2">Real-time data visualization of your infrastructure spend.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={fetchAnalytics} variant="outline" className="border-white/10 bg-white/5 h-10 hover:bg-white/10">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Sync Data
                        </Button>
                    </div>
                </div>

                {/* Anomaly Banner */}
                {summary?.anomalies?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-400"
                    >
                        <div className="p-2 rounded-xl bg-red-500/10">
                            <AlertTriangle className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">Critical Anomalies Detected</h4>
                            <p className="text-xs opacity-80">{summary.anomalies[0].message}</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                            Investigate
                        </Button>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="w-6 h-6" /></div>
                                {stat.trend !== null && (
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${stat.trend >= 0 ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                        <TrendingUp className={`w-3 h-3 ${stat.trend < 0 ? 'rotate-180' : ''}`} />
                                        {Math.abs(stat.trend)}%
                                    </div>
                                )}
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                            <div className="text-3xl font-bold mt-1">
                                {stat.unit === '%' ? '' : formatAmount(stat.value).replace(/[0-9.,\s]/g, '')}
                                <CountUp end={stat.unit === '%' ? stat.value : convertAmount(stat.value)} decimals={stat.unit === '%' ? 0 : 2} />
                                {stat.unit || ''}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{stat.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-8"><PieChartIcon className="w-5 h-5 text-blue-400" /> Spend Allocation</h3>
                        <div className="h-[300px]">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [formatAmount(value), 'Spend']}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <Activity className="w-12 h-12 mb-2 opacity-20" />
                                    <p className="text-sm">No billing data found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trends */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-8"><Activity className="w-5 h-5 text-emerald-400" /> Expense Velocity</h3>
                        <div className="h-[300px]">
                            {trends.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="period" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => formatAmount(v)} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                            formatter={(value: number) => [formatAmount(value), '']}
                                        />
                                        <Area type="monotone" dataKey="cost" stroke="#0ea5e9" fill="#0ea5e920" />
                                        <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <Activity className="w-12 h-12 mb-2 opacity-20" />
                                    <p className="text-sm text-center">Maintain your connections to build historical trends.<br /><span className="text-xs opacity-50">Trend data appears after the first billing cycle.</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Prediction Animation & Widget */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {predicting ? (
                                <motion.div key="predicting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center gap-4 text-emerald-400">
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Zap className="w-12 h-12" /></motion.div>
                                    <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-sm font-bold tracking-widest uppercase">Analyzing Usage Velocity...</motion.p>
                                    <div className="w-48 h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                                        <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-full h-full bg-emerald-500" />
                                    </div>
                                </motion.div>
                            ) : forecast?.projectedSpend > 0 ? (
                                <motion.div key="forecast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-4"><Zap className="w-3 h-3" /> AI Forecast</div>
                                        <h3 className="text-2xl font-bold mb-2">Projected EOM Spend</h3>
                                        <p className="text-slate-400 text-sm mb-6">Based on your current consumption velocity for {forecast?.period}.</p>
                                        <div className="text-5xl font-bold text-white mb-2">{formatAmount(forecast?.projectedSpend || 0)}</div>
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                            <span>Current: {formatAmount(forecast?.currentSpend || 0)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span>{forecast?.daysRemaining} days left</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-emerald-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <span className={`w-2 h-2 rounded-full ${forecast?.confidence === 'high' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <span className="text-slate-400 uppercase">Confidence:</span>
                                            <span className="text-white">{forecast?.confidence?.toUpperCase()}</span>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="empty-forecast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 text-center">
                                    <Clock className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">Not enough data to forecast spend.</p>
                                    <p className="text-xs opacity-50 max-w-[250px]">Forecasting requires at least 3 days of billing activity in the current month.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Dynamic Optimization Tips */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-400" /> Dynamic Savings Opportunities</h3>
                        <div className="space-y-4">
                            {summary?.optimizationTips?.length > 0 ? (
                                summary.optimizationTips.map((tip: any, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Zap className="w-4 h-4" /></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-sm font-bold group-hover:text-emerald-400 transition-colors">{tip.title}</h4>
                                                <span className="text-xs font-bold text-emerald-400">Save {formatAmount(tip.savings || 0)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">{tip.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                                    <MousePointer2 className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs">No active leaks detected. You're optimized!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Feature: Service Heatmap / Efficiency Matrix */}
                {summary?.serviceVelocity?.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Layers className="w-5 h-5 text-cyan-400" /> Service Growth Velocity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {summary.serviceVelocity.map((svc: any) => (
                                <div key={svc.name} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{svc.name}</span>
                                        <div className={`flex items-center text-[10px] font-bold ${svc.growth >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {svc.growth >= 0 ? '+' : ''}{svc.growth}%
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold">{formatAmount(svc.cost || 0)}</div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                                        <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (svc.cost / summary.totalCurrentSpend) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AnalyticsPage;
