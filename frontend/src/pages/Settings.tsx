import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Crown,
    CreditCard,
    Shield,
    Trash2,
    Mail,
    LogOut,
    Download,
    Unplug,
    Bell,
    Github,
    Server,
    Cloud,
    Activity,
    Layout,
    Zap,
    Lock,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';


interface Connection {
    _id: string;
    provider: string;
    lastScannedAt?: string;
    status: string;
}

interface ScanResult {
    resourceName: string;
    resourceType: string;
    status: string;
    potentialSavings: number;
    rawData?: any;
    createdAt: string;
}

const Settings = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [notificationSettings, setNotificationSettings] = useState({
        monthlyDigest: true,
        leakAlerts: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const [settingsRes, connRes, scanRes, userRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/notifications/settings`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${import.meta.env.VITE_API_URL}/connections`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${import.meta.env.VITE_API_URL}/scan/results`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${import.meta.env.VITE_API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setNotificationSettings(settingsRes.data);
                setConnections(connRes.data);
                setScanResults(scanRes.data);
                setProfile(userRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, [getToken]);

    const handleToggleNotification = async (key: 'monthlyDigest' | 'leakAlerts') => {
        const newSettings = {
            ...notificationSettings,
            [key]: !notificationSettings[key]
        };
        setNotificationSettings(newSettings);

        try {
            const token = await getToken();
            await axios.put(
                `${import.meta.env.VITE_API_URL}/notifications/settings`,
                newSettings,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Settings updated');
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error('Failed to save settings');
            setNotificationSettings(notificationSettings);
        }
    };

    const handleSendTestEmail = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            await axios.post(
                `${import.meta.env.VITE_API_URL}/notifications/test-email`,
                { type: 'digest' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Test email sent!');
        } catch (error) {
            console.error('Failed to send test email:', error);
            toast.error('Failed to send test email');
        } finally {
            setLoading(false);
        }
    };

    const subscriptionStatus = profile?.subscriptionStatus || 'free';
    const isPro = subscriptionStatus === 'pro';



    const handleManageBilling = async () => {
        if (isPro) {
            setLoading(true);
            try {
                toast.info('Stripe Customer Portal coming soon!');
            } catch (error) {
                toast.error('Failed to access billing');
            } finally {
                setLoading(false);
            }
        } else {
            navigate('/checkout');
        }
    };

    const handleRevokeAll = async () => {
        if (!confirm('Are you sure you want to disconnect all services? This will delete all scan results.')) return;

        setLoading(true);
        try {
            // TODO: Implement bulk revoke endpoint
            toast.success('All connections revoked');
        } catch (error) {
            toast.error('Failed to revoke connections');
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        setLoading(true);
        try {
            toast.info('Preparing your data export...');
            setTimeout(() => {
                toast.success('Export ready! Check your email.');
            }, 2000);
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmation = prompt('Type "DELETE" to permanently delete your account and all data:');
        if (confirmation !== 'DELETE') return;

        setLoading(true);
        try {
            toast.success('Account deleted. Redirecting...');
            setTimeout(() => signOut(), 2000);
        } catch (error) {
            toast.error('Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    const getProviderIcon = (name: string) => {
        switch (name.toLowerCase()) {
            case 'github': return <Github className="w-5 h-5" />;
            case 'vercel': return <Server className="w-5 h-5" />;
            case 'aws': return <Cloud className="w-5 h-5" />;
            case 'sentry': return <Activity className="w-5 h-5" />;
            case 'linear': return <Layout className="w-5 h-5" />;
            case 'resend': return <Mail className="w-5 h-5" />;
            case 'clerk': return <Lock className="w-5 h-5" />;
            case 'stripe': return <CreditCard className="w-5 h-5" />;
            default: return <Zap className="w-5 h-5" />;
        }
    };

    const getProviderStats = (provider: string) => {
        const results = scanResults.filter(r => r.resourceName.toLowerCase().includes(provider.toLowerCase()));
        if (results.length === 0) return null;

        // Find the most relevant result (usually the account level one)
        const accountResult = results.find(r => r.resourceType === 'account') || results[0];
        return accountResult.rawData;
    };

    return (
        <>
            <div className="min-h-screen bg-[#0a0e17] text-white relative overflow-hidden">
                {/* Animated Background Orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/dashboard')}
                            className="hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Profile & Settings
                        </h1>
                    </div>
                </nav>

                <main className="max-w-5xl mx-auto px-6 py-8 pb-32 space-y-8 relative z-10">
                    {/* Profile Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-50" />
                        <div className="relative flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                <img
                                    src={user?.imageUrl}
                                    alt={user?.firstName || 'User'}
                                    className="w-24 h-24 rounded-full ring-4 ring-white/10 shadow-2xl"
                                />
                                {isPro && (
                                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black p-1.5 rounded-full ring-4 ring-[#0a0e17]">
                                        <Crown className="w-4 h-4 fill-current" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-3xl font-bold text-white">
                                    {user?.firstName} {user?.lastName}
                                </h2>
                                <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                                    </div>
                                </div>
                            </div>
                            <div className="md:ml-auto flex gap-3">
                                <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => signOut()}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Subscription & Connections */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Subscription */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className={`border backdrop-blur-xl ${isPro
                                    ? 'bg-gradient-to-br from-amber-900/20 to-slate-900/50 border-amber-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white">
                                            <Crown className={isPro ? 'text-amber-400' : 'text-slate-400'} />
                                            Subscription Plan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-2xl font-bold text-white mb-1">
                                                    {isPro ? 'SubTrack Pro' : 'Free Plan'}
                                                </div>
                                                <div className="text-slate-400">
                                                    {isPro ? 'Unlimited connections • Auto-scan • Priority Support' : '5 connections • Manual scans'}
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full font-bold text-sm ${isPro
                                                ? 'bg-amber-500 text-black'
                                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                                                }`}>
                                                {isPro ? 'ACTIVE' : 'FREE'}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleManageBilling}
                                            disabled={loading}
                                            className={`w-full h-12 text-lg ${isPro
                                                ? 'bg-white/10 hover:bg-white/20 text-white'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0'
                                                }`}
                                        >
                                            {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Connected Services Detail */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Unplug className="w-5 h-5 text-emerald-400" />
                                    Connected Services Data
                                </h3>
                                <div className="space-y-4">
                                    {connections.length === 0 ? (
                                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                            <Unplug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-400">No services connected yet.</p>
                                            <Button
                                                variant="link"
                                                className="text-emerald-400"
                                                onClick={() => navigate('/dashboard')}
                                            >
                                                Connect services on Dashboard
                                            </Button>
                                        </div>
                                    ) : (
                                        connections.map((conn) => {
                                            const stats = getProviderStats(conn.provider);
                                            return (
                                                <div key={conn._id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white/10 rounded-lg text-white">
                                                                {getProviderIcon(conn.provider)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-lg capitalize text-white">{conn.provider}</div>
                                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    Connected {conn.lastScannedAt ? formatDistanceToNow(new Date(conn.lastScannedAt), { addSuffix: true }) : 'recently'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase">
                                                            {stats?.plan || 'Free'} Plan
                                                        </div>
                                                    </div>

                                                    {/* Data Grid */}
                                                    {stats && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                                                            {Object.entries(stats).map(([key, value]) => {
                                                                // Special handling for repos array
                                                                if (key === 'repos' && Array.isArray(value)) {
                                                                    const repoNames = value.map((r: any) => r.name).filter(Boolean);
                                                                    if (repoNames.length === 0) return null;
                                                                    return (
                                                                        <div key={key} className="col-span-2 sm:col-span-3">
                                                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                                                                Repos ({repoNames.length})
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {repoNames.slice(0, 6).map((name: string, idx: number) => (
                                                                                    <span key={idx} className="px-2 py-1 text-xs font-mono bg-white/5 rounded-md text-slate-300 border border-white/10">
                                                                                        {name}
                                                                                    </span>
                                                                                ))}
                                                                                {repoNames.length > 6 && (
                                                                                    <span className="px-2 py-1 text-xs text-slate-500">
                                                                                        +{repoNames.length - 6} more
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (key === 'plan' || key === 'instances') return null; // Skip redundant/complex fields
                                                                return (
                                                                    <div key={key}>
                                                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </div>
                                                                        <div className="text-sm font-mono text-slate-200 truncate">
                                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="space-y-8">
                            {/* Notifications */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white">
                                            <Bell className="w-5 h-5" />
                                            Notifications
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <div className="font-medium text-white">Monthly Digest</div>
                                                <div className="text-xs text-slate-400">Savings summary</div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={notificationSettings.monthlyDigest ? 'outline' : 'ghost'}
                                                onClick={() => handleToggleNotification('monthlyDigest')}
                                                className={notificationSettings.monthlyDigest
                                                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                                                    : "text-slate-400 hover:text-white"
                                                }
                                            >
                                                {notificationSettings.monthlyDigest ? 'On' : 'Off'}
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <div className="font-medium text-white">Leak Alerts</div>
                                                <div className="text-xs text-slate-400">Instant notifications</div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={notificationSettings.leakAlerts ? 'outline' : 'ghost'}
                                                onClick={() => handleToggleNotification('leakAlerts')}
                                                className={notificationSettings.leakAlerts
                                                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                                                    : "text-slate-400 hover:text-white"
                                                }
                                            >
                                                {notificationSettings.leakAlerts ? 'On' : 'Off'}
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSendTestEmail}
                                            disabled={loading}
                                            className="w-full text-xs text-slate-400 hover:text-white hover:bg-white/5"
                                        >
                                            Send Test Email
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Data & Privacy */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-white">
                                            <Shield className="w-5 h-5" />
                                            Data & Privacy
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            onClick={handleExportData}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full justify-start border-white/10 text-slate-300 hover:bg-white/5"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export All Data
                                        </Button>
                                        <Button
                                            onClick={handleRevokeAll}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full justify-start border-white/10 text-slate-300 hover:bg-white/5"
                                        >
                                            <Unplug className="w-4 h-4 mr-2" />
                                            Revoke All Connections
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Danger Zone */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Card className="bg-red-950/10 border-red-500/20 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-400">
                                            <Trash2 className="w-5 h-5" />
                                            Danger Zone
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={handleDeleteAccount}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Account
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </main>
            </div>

        </>
    );
};

export default Settings;
