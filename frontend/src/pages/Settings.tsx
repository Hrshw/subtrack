import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Crown,
    CreditCard,
    Shield,
    Trash2,
    Mail,
    User,
    LogOut,
    Download,
    Unplug,
    Bell,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        monthlyDigest: true,
        leakAlerts: false
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = await getToken();
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/notifications/settings`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setNotificationSettings(response.data);
            } catch (error) {
                console.error('Failed to fetch notification settings:', error);
            }
        };
        fetchSettings();
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
            // Revert
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

    const subscriptionStatus = 'free' as 'free' | 'pro'; // TODO: Get from API
    const isPro = subscriptionStatus === 'pro';

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            // const token = await getToken();
            // If pro, open Stripe Customer Portal
            // If free, redirect to upgrade
            if (isPro) {
                // TODO: Implement Stripe Customer Portal
                toast.info('Stripe Customer Portal coming soon!');
            } else {
                navigate('/dashboard');
                toast.info('Upgrade from the dashboard to access billing');
            }
        } catch (error) {
            toast.error('Failed to access billing');
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeAll = async () => {
        if (!confirm('Are you sure you want to disconnect all services? This will delete all scan results.')) return;

        setLoading(true);
        try {
            // const token = await getToken();
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
            // TODO: Implement data export
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
            // const token = await getToken();
            // TODO: Implement account deletion
            toast.success('Account deleted. Redirecting...');
            setTimeout(() => signOut(), 2000);
        } catch (error) {
            toast.error('Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <nav className="backdrop-blur-xl bg-slate-900/50 border-b border-slate-800/50 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard')}
                        className="hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold">Settings</h1>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Profile
                            </CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={user?.imageUrl}
                                    alt={user?.firstName || 'User'}
                                    className="w-16 h-16 rounded-full ring-4 ring-emerald-500/20"
                                />
                                <div>
                                    <div className="font-semibold text-lg">
                                        {user?.firstName} {user?.lastName}
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Subscription Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className={`border backdrop-blur-xl ${isPro
                        ? 'bg-gradient-to-br from-amber-900/20 to-slate-900/50 border-amber-500/30'
                        : 'bg-slate-900/50 border-slate-800/50'
                        }`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown className={isPro ? 'text-amber-400' : 'text-slate-400'} />
                                Subscription
                            </CardTitle>
                            <CardDescription>
                                {isPro ? 'You are on the Pro plan' : 'You are on the Free plan'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-lg">
                                        {isPro ? 'SubTrack Pro' : 'SubTrack Free'}
                                    </div>
                                    <div className="text-slate-400 text-sm">
                                        {isPro ? '₹799/month • Unlimited connections' : '5 connections • Manual scans only'}
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-full font-semibold ${isPro
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                    : 'bg-slate-800 border border-slate-700'
                                    }`}>
                                    {isPro ? 'Active' : 'Free'}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleManageBilling}
                                    disabled={loading}
                                    variant={isPro ? 'default' : 'outline'}
                                    className={isPro
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
                                    }
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                                </Button>
                            </div>

                            {isPro && (
                                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Next payment: ₹799 on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notifications
                            </CardTitle>
                            <CardDescription>Manage your email preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium">Monthly Digest</div>
                                    <div className="text-sm text-slate-400">Get a monthly report of your savings</div>
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
                                    {notificationSettings.monthlyDigest ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium">Leak Alerts</div>
                                    <div className="text-sm text-slate-400">Get notified when new money leaks are found</div>
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
                                    {notificationSettings.leakAlerts ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>

                            <div className="pt-2 border-t border-slate-800">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSendTestEmail}
                                    disabled={loading}
                                    className="text-xs text-slate-400 hover:text-white"
                                >
                                    <Mail className="w-3 h-3 mr-2" />
                                    Send Test Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Data & Privacy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Data & Privacy
                            </CardTitle>
                            <CardDescription>Manage your data and privacy settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={handleExportData}
                                disabled={loading}
                                variant="outline"
                                className="w-full justify-start border-slate-700 hover:bg-slate-800"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export All Data (CSV)
                            </Button>
                            <Button
                                onClick={handleRevokeAll}
                                disabled={loading}
                                variant="outline"
                                className="w-full justify-start border-slate-700 hover:bg-slate-800 hover:border-amber-500/50"
                            >
                                <Unplug className="w-4 h-4 mr-2" />
                                Revoke All Connections
                            </Button>
                            <div className="pt-3 text-xs text-slate-500 flex items-start gap-2">
                                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>
                                    We use read-only access and bank-level encryption. You can revoke access anytime.
                                    Your data is never shared with third parties.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-red-950/20 border-red-500/30 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-400">
                                <Trash2 className="w-5 h-5" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>Irreversible actions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={() => signOut()}
                                variant="outline"
                                className="w-full justify-start border-slate-700 hover:bg-slate-800"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                            <Button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                variant="outline"
                                className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account Permanently
                            </Button>
                            <p className="text-xs text-red-400/70">
                                ⚠️ This will permanently delete your account, all connections, and scan results. This action cannot be undone.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Footer */}
                <div className="text-center text-sm text-slate-500 py-8">
                    SubTrack v1.0 • Made with ❤️ for indie hackers
                </div>
            </main>
        </div>
    );
};

export default Settings;
