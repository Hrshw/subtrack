import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Copy, Share2, Gift, Check } from 'lucide-react';

import { getApiUrl } from '../lib/api';

interface ReferralStats {
    code: string;
    totalReferrals: number;
    pendingReferrals: number;
    qualifiedReferrals: number;
    rewardsEarned: number;
}

export function ReferralCard() {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await getToken();
                const response = await axios.get(`${getApiUrl()}/referral/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch referral stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [getToken]);

    const copyCode = async () => {
        if (stats?.code) {
            await navigator.clipboard.writeText(stats.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareOnTwitter = () => {
        if (stats?.code) {
            const text = encodeURIComponent(`I'm saving money on my dev tool subscriptions with SubTrack! Use my referral code ${stats.code} to get started: ${window.location.origin}?ref=${stats.code}`);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        }
    };

    const shareOnWhatsApp = () => {
        if (stats?.code) {
            const text = encodeURIComponent(`Hey! I'm using SubTrack to find zombie subscriptions in my dev tools. Use my referral code ${stats.code} to get started: ${window.location.origin}?ref=${stats.code}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
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
        <Card className="p-6 bg-gradient-to-br from-emerald-900/30 to-slate-800/50 border-emerald-700/30">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Refer & Earn</h3>
                    <p className="text-xs text-slate-400">Get 1 free month for each friend who connects 3+ services</p>
                </div>
            </div>

            {/* Referral Code */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-400 mb-2">Your Referral Code</p>
                <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold text-emerald-400 flex-1">
                        {stats?.code || '--------'}
                    </code>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCode}
                        className="border-slate-600 hover:bg-slate-700"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-white">{stats?.totalReferrals || 0}</p>
                    <p className="text-xs text-slate-400">Total</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-amber-400">{stats?.pendingReferrals || 0}</p>
                    <p className="text-xs text-slate-400">Pending</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-emerald-400">{stats?.rewardsEarned || 0}</p>
                    <p className="text-xs text-slate-400">Months Earned</p>
                </div>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={shareOnTwitter}
                    className="flex-1 border-slate-600 hover:bg-slate-700"
                >
                    <Share2 className="w-4 h-4 mr-2" /> Twitter
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={shareOnWhatsApp}
                    className="flex-1 border-slate-600 hover:bg-slate-700"
                >
                    <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
            </div>
        </Card>
    );
}

export default ReferralCard;
