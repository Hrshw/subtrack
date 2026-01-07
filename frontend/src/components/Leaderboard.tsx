import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './ui/card';
import { TrendingUp, Users, Zap } from 'lucide-react';

import { getApiUrl } from '../lib/api';
import { useCurrency } from '../contexts/CurrencyContext';

interface LeaderboardData {
    thisMonth: {
        savings: number;
        users: number;
        zombiesKilled: number;
    };
    allTime: {
        savings: number;
    };
}

export function Leaderboard() {
    const { formatAmount, convertAmount, getSymbol } = useCurrency();
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await axios.get(`${getApiUrl()}/analytics/leaderboard`);
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    // Format large numbers with K/M suffix using dynamic currency
    const formatCompactCurrency = (amountINR: number) => {
        const converted = convertAmount(amountINR);
        const symbol = getSymbol();
        if (converted >= 1000000) {
            return `${symbol}${(converted / 1000000).toFixed(1)}M`;
        } else if (converted >= 1000) {
            return `${symbol}${(converted / 1000).toFixed(1)}K`;
        }
        return formatAmount(amountINR);
    };

    if (loading) {
        return (
            <Card className="p-6 bg-slate-800/50 border-slate-700 overflow-hidden relative">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-12 bg-slate-700 rounded"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-800/50 border-purple-700/30 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Community Savings</h3>
                </div>

                {/* Main Stat */}
                <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-purple-400 mb-1">
                        {formatCompactCurrency(data?.thisMonth?.savings || 0)}
                    </p>
                    <p className="text-sm text-slate-400">saved this month by SubTrack users</p>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-lg font-bold text-white">
                                {data?.thisMonth?.users || 0}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Active Users</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span className="text-lg font-bold text-white">
                                {data?.thisMonth?.zombiesKilled || 0}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Zombies Killed</p>
                    </div>
                </div>

                {/* All-time footer */}
                <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400">
                        All-time savings: <span className="text-purple-400 font-semibold">{formatCompactCurrency(data?.allTime?.savings || 0)}</span>
                    </p>
                </div>
            </div>
        </Card>
    );
}

export default Leaderboard;
