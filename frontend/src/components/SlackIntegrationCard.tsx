import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MessageSquare, Check, X, Loader2 } from 'lucide-react';

import { getApiUrl } from '../lib/api';

interface SlackStatus {
    connected: boolean;
    teamName?: string;
    channelName?: string;
    notificationsEnabled?: boolean;
    weeklyPulseEnabled?: boolean;
}

export function SlackIntegrationCard() {
    const { getToken } = useAuth();
    const [status, setStatus] = useState<SlackStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const token = await getToken();
            const response = await axios.get(`${getApiUrl()}/slack/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to fetch Slack status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Check URL for Slack callback result
        const params = new URLSearchParams(window.location.search);
        if (params.get('slack') === 'success') {
            fetchStatus();
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [getToken]);

    const handleConnect = async () => {
        try {
            setActionLoading(true);
            const token = await getToken();
            const response = await axios.get(`${getApiUrl()}/slack/install`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.authUrl) {
                window.location.href = response.data.authUrl;
            }
        } catch (error: any) {
            console.error('Failed to initiate Slack connection:', error);
            if (error.response?.data?.message === 'Slack integration not configured') {
                alert('Slack integration is not configured. Please contact support.');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Slack?')) return;

        try {
            setActionLoading(true);
            const token = await getToken();
            await axios.delete(`${getApiUrl()}/slack/disconnect`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ connected: false });
        } catch (error) {
            console.error('Failed to disconnect Slack:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendTest = async () => {
        try {
            setActionLoading(true);
            const token = await getToken();
            await axios.post(`${getApiUrl()}/slack/test`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Test message sent to Slack!');
        } catch (error) {
            console.error('Failed to send test message:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSetting = async (setting: 'notificationsEnabled' | 'weeklyPulseEnabled') => {
        try {
            const token = await getToken();
            const newValue = !status?.[setting];
            await axios.patch(`${getApiUrl()}/slack/settings`, {
                [setting]: newValue
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus(prev => prev ? { ...prev, [setting]: newValue } : prev);
        } catch (error) {
            console.error('Failed to update Slack settings:', error);
        }
    };

    if (loading) {
        return (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-10 bg-slate-700 rounded"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status?.connected ? 'bg-[#4A154B]' : 'bg-slate-700'
                    }`}>
                    <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white">Slack Integration</h3>
                    <p className="text-xs text-slate-400">
                        {status?.connected
                            ? `Connected to ${status.teamName || 'Workspace'}`
                            : 'Get weekly savings reports in Slack'
                        }
                    </p>
                </div>
                {status?.connected && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Connected</span>
                    </div>
                )}
            </div>

            {status?.connected ? (
                <>
                    {/* Channel Info */}
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-slate-400">Sending to</p>
                        <p className="text-white font-medium">#{status.channelName || 'general'}</p>
                    </div>

                    {/* Settings Toggles */}
                    <div className="space-y-3 mb-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-300">Weekly Pulse Reports</span>
                            <button
                                onClick={() => toggleSetting('weeklyPulseEnabled')}
                                className={`w-10 h-6 rounded-full transition-colors ${status.weeklyPulseEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${status.weeklyPulseEnabled ? 'translate-x-4' : ''
                                    }`} />
                            </button>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-300">Alert Notifications</span>
                            <button
                                onClick={() => toggleSetting('notificationsEnabled')}
                                className={`w-10 h-6 rounded-full transition-colors ${status.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${status.notificationsEnabled ? 'translate-x-4' : ''
                                    }`} />
                            </button>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendTest}
                            disabled={actionLoading}
                            className="flex-1 border-slate-600 hover:bg-slate-700"
                        >
                            Send Test
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnect}
                            disabled={actionLoading}
                            className="border-red-600/50 text-red-400 hover:bg-red-600/20"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </>
            ) : (
                <Button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="w-full bg-[#4A154B] hover:bg-[#611f69] text-white"
                >
                    {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Connect Slack
                </Button>
            )}
        </Card>
    );
}

export default SlackIntegrationCard;
