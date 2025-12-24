import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { useAuth } from "@clerk/clerk-react";
import {
    ArrowLeft,
    Database,
    Server,
    Box,
    Globe,
    Code,
    Settings,
    Clock,
    AlertTriangle,
    Zap,
    Search,
    Filter,
    LayoutDashboard,
    HardDrive,
    Cpu,
    Layers,
    GitBranch,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { calculateTotalMonthlyCost } from '../lib/costEstimator';

// --- Types ---
interface ScanResult {
    _id: string;
    resourceName: string;
    resourceType: string;
    status: 'zombie' | 'downgrade_possible' | 'active';
    potentialSavings: number;
    currency: string;
    reason: string;
    smartRecommendation?: string;
    rawData?: any;
    createdAt: string;
    connectionId?: string | { _id: string; provider: string };
}

interface ServiceStats {
    totalResources: number;
    totalSavings: number;
    activeRegions: number;
    zombieCount: number;
    monthlyCost?: number;
}

// --- Helper Functions ---

const getResourceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('bucket') || t.includes('storage') || t.includes('s3')) return <Database className="w-5 h-5" />;
    if (t.includes('instance') || t.includes('server') || t.includes('ec2')) return <Server className="w-5 h-5" />;
    if (t.includes('function') || t.includes('lambda')) return <Code className="w-5 h-5" />;
    if (t.includes('repo') || t.includes('git')) return <GitBranch className="w-5 h-5" />;
    if (t.includes('db') || t.includes('rds') || t.includes('dynamo')) return <HardDrive className="w-5 h-5" />;
    return <Box className="w-5 h-5" />;
};

const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('storage') || c.includes('s3')) return <Database className="w-4 h-4" />;
    if (c.includes('compute') || c.includes('ec2')) return <Cpu className="w-4 h-4" />;
    if (c.includes('database') || c.includes('rds')) return <HardDrive className="w-4 h-4" />;
    if (c.includes('serverless') || c.includes('lambda')) return <Zap className="w-4 h-4" />;
    if (c.includes('repo')) return <GitBranch className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
};

const getResourceStatusColor = (resource: any, type: string) => {
    let daysUnused = 0;
    const dateField = resource.lastModified || resource.pushed_at || resource.launchTime || resource.createdAt;

    if (dateField) {
        try {
            const date = parseISO(dateField);
            daysUnused = differenceInDays(new Date(), date);
        } catch (e) {
            console.error("Error parsing date", e);
        }
    }

    if (daysUnused > 30) return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (daysUnused > 15) return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    if (daysUnused > 10) return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
};

const getStatusLabel = (colorClass: string) => {
    if (colorClass.includes('red')) return 'Zombie (>30d)';
    if (colorClass.includes('orange')) return 'Warning (>15d)';
    if (colorClass.includes('amber')) return 'Caution (>10d)';
    return 'Active';
};

// --- Components ---

const ResourceCard = ({ resource, type }: { resource: any, type: string }) => {
    const statusColor = getResourceStatusColor(resource, type);
    const statusLabel = getStatusLabel(statusColor);
    const name = resource.name || resource.resourceName || 'Unknown Resource';
    const region = resource.region || 'Global';
    const date = resource.lastModified || resource.pushed_at || resource.launchTime || resource.createdAt;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${statusColor} hover:bg-opacity-20 bg-opacity-5`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-black/20 backdrop-blur-sm`}>
                        {getResourceIcon(type)}
                    </div>
                    <div>
                        <h4 className="font-semibold text-white text-sm truncate max-w-[200px]" title={name}>
                            {name}
                        </h4>
                        <p className="text-xs opacity-70 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {region}
                        </p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-black/20 backdrop-blur-md`}>
                    {statusLabel}
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/10">
                <div className="text-xs opacity-60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {date ? formatDistanceToNow(parseISO(date), { addSuffix: true }) : 'Unknown'}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs hover:bg-white/10"
                    onClick={() => {
                        navigator.clipboard.writeText(name);
                        toast.success('Resource name copied');
                    }}
                >
                    Copy ID
                </Button>
            </div>
        </motion.div>
    );
};

const ServiceDetailPage = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [activeView, setActiveView] = useState<string>('overview');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!isLoaded) return;
            if (!isSignedIn) {
                navigate('/login');
                return;
            }

            try {
                const token = await getToken();
                if (!token) return;

                const response = await axios.get(`${getApiUrl()}/scan/results`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const serviceResults = response.data.filter((r: ScanResult) => {
                    const connId = typeof r.connectionId === 'object'
                        ? (r.connectionId as any)._id
                        : r.connectionId;
                    return connId?.toLowerCase() === serviceId?.toLowerCase();
                });
                setScanResults(serviceResults);
            } catch (error) {
                console.error('Error fetching details:', error);
                toast.error('Failed to load service details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [serviceId, navigate, getToken, isLoaded, isSignedIn]);

    // Group resources by type/category
    const { allResources, categories, serviceName } = useMemo(() => {
        let resources: any[] = [];
        let providerName = 'Service';

        scanResults.forEach(result => {
            // Try to get provider name
            if (result.connectionId && typeof result.connectionId === 'object' && 'provider' in result.connectionId) {
                providerName = (result.connectionId as any).provider;
            }

            if (result.rawData) {
                if (Array.isArray(result.rawData)) {
                    resources = [...resources, ...result.rawData.map(r => ({ ...r, _category: result.resourceType }))];
                } else if (typeof result.rawData === 'object') {
                    Object.entries(result.rawData).forEach(([key, val]: [string, any]) => {
                        if (Array.isArray(val)) {
                            // Map array items and assign a category based on the key (e.g., "s3Buckets" -> "S3 Buckets")
                            const categoryName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            resources = [...resources, ...val.map(r => ({ ...r, _category: categoryName }))];
                        }
                    });
                }
            }
        });

        // Unique categories
        const cats = Array.from(new Set(resources.map(r => r._category || 'Other')));

        // Capitalize provider name
        providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
        if (providerName.toLowerCase() === 'aws') providerName = 'AWS';

        return { allResources: resources, categories: cats, serviceName: providerName };
    }, [scanResults]);

    const stats: ServiceStats = useMemo(() => {
        const monthlyCost = calculateTotalMonthlyCost(scanResults, serviceName);
        return {
            totalResources: allResources.length,
            totalSavings: scanResults.reduce((acc, curr) => acc + curr.potentialSavings, 0),
            activeRegions: new Set(allResources.map(r => r.region).filter(Boolean)).size,
            zombieCount: scanResults.filter(r => r.status === 'zombie').length,
            monthlyCost: monthlyCost
        };
    }, [allResources, scanResults, serviceName]);

    const filteredResources = useMemo(() => {
        let filtered = allResources;

        // Filter by View (Category)
        if (activeView !== 'overview' && activeView !== 'settings') {
            filtered = filtered.filter(r => r._category === activeView);
        }

        // Filter by Search
        return filtered.filter(r =>
            (r.name || r.resourceName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allResources, searchQuery, activeView]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0e17] text-white font-sans overflow-hidden selection:bg-emerald-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0a0e17]">
                <div className="p-6">
                    <Button
                        variant="ghost"
                        className="w-full justify-start pl-0 text-slate-400 hover:text-white hover:bg-transparent mb-6"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Box className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-none">{serviceName}</h2>
                            <span className="text-xs text-slate-500">Connected</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">General</p>
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Overview
                    </button>

                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Resources</p>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveView(category)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeView === category
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {getCategoryIcon(category)}
                            <span className="truncate">{category}</span>
                            <span className="ml-auto text-xs opacity-50">
                                {allResources.filter(r => r._category === category).length}
                            </span>
                        </button>
                    ))}

                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Configuration</p>
                    <button
                        onClick={() => setActiveView('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'settings'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 border border-emerald-500/20">
                        <p className="text-xs text-slate-400 mb-1">Potential Savings</p>
                        <div className="text-2xl font-bold text-white">₹{stats.totalSavings.toLocaleString()}</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#0a0e17]">
                <div className="max-w-6xl mx-auto p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {activeView === 'overview' ? 'Overview' : activeView === 'settings' ? 'Settings' : activeView}
                            </h1>
                            <p className="text-slate-400">
                                {activeView === 'overview'
                                    ? `High-level insights for your ${serviceName} environment.`
                                    : activeView === 'settings'
                                        ? 'Manage connection settings and preferences.'
                                        : `Manage your ${activeView.toLowerCase()} resources.`}
                            </p>
                        </div>
                        {activeView !== 'overview' && activeView !== 'settings' && (
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 w-64"
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeView === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-4 text-slate-400">
                                            <Server className="w-5 h-5" />
                                            <span className="text-sm font-medium">Total Resources</span>
                                        </div>
                                        <div className="text-3xl font-bold text-white">{stats.totalResources}</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-4 text-slate-400">
                                            <CreditCard className="w-5 h-5" />
                                            <span className="text-sm font-medium">Est. Monthly Spend</span>
                                        </div>
                                        <div className="text-3xl font-bold text-white">
                                            ₹{(stats.monthlyCost || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-4 text-slate-400">
                                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                                            <span className="text-sm font-medium">Zombie Resources</span>
                                        </div>
                                        <div className="text-3xl font-bold text-white">{stats.zombieCount}</div>
                                    </div>
                                </div>

                                {/* Top Savings */}
                                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-white/10">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                        Top Savings Opportunities
                                    </h3>
                                    <div className="space-y-4">
                                        {scanResults.slice(0, 3).map((result) => (
                                            <div key={result._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                <div>
                                                    <h4 className="font-medium text-white">{result.resourceName}</h4>
                                                    <p className="text-xs text-slate-400">{result.resourceType}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-emerald-400 font-bold">₹{result.potentialSavings}</div>
                                                    <div className="text-[10px] text-slate-500">potential savings</div>
                                                </div>
                                            </div>
                                        ))}
                                        {scanResults.length === 0 && (
                                            <p className="text-slate-500 text-center py-4">No issues found. Great job!</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeView === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Settings className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Service Settings</h3>
                                <p className="text-slate-400 max-w-md">
                                    Configure scan frequency, excluded regions, and alert thresholds for {serviceName}.
                                </p>
                                <Button className="mt-8" variant="outline" disabled>Coming Soon</Button>
                            </motion.div>
                        )}

                        {activeView !== 'overview' && activeView !== 'settings' && (
                            <motion.div
                                key="resource-list"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {filteredResources.map((resource, idx) => (
                                    <ResourceCard key={idx} resource={resource} type={activeView} />
                                ))}
                                {filteredResources.length === 0 && (
                                    <div className="col-span-full text-center py-20 text-slate-500">
                                        No resources found matching your search.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default ServiceDetailPage;
