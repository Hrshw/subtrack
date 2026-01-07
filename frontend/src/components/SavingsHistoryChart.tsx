import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Card } from './ui/card';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

const getApiUrl = () => {
    const env = (import.meta as any).env;
    return env?.VITE_API_URL || 'http://localhost:5000';
};

interface HistoryDataPoint {
    date: string;
    totalSavings: number;
    zombieCount: number;
    activeCount: number;
}

export function SavingsHistoryChart() {
    const { getToken } = useAuth();
    const { formatAmount, convertAmount, getSymbol } = useCurrency();
    const [data, setData] = useState<HistoryDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<7 | 30 | 90>(30);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const response = await axios.get(`${getApiUrl()}/api/analytics/history?days=${period}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Format data for chart
                const formattedData = response.data.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                    }),
                    totalSavings: item.totalSavings || 0,
                    zombieCount: item.zombieCount || 0,
                    activeCount: item.activeCount || 0
                }));

                setData(formattedData);
            } catch (error) {
                console.error('Failed to fetch savings history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [getToken, period]);

    const formatCompactCurrency = (value: number) => {
        const converted = convertAmount(value);
        const symbol = getSymbol();
        if (converted >= 1000) {
            return `${symbol}${(converted / 1000).toFixed(1)}K`;
        }
        return formatAmount(value);
    };

    if (loading) {
        return (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-48 bg-slate-700 rounded"></div>
                </div>
            </Card>
        );
    }

    // If no data, show placeholder
    if (data.length === 0) {
        return (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-semibold text-white">Savings Trend</h3>
                </div>
                <div className="h-48 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Run scans to see your savings history</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-semibold text-white">Savings Trend</h3>
                </div>
                <div className="flex gap-1">
                    {([7, 30, 90] as const).map((d) => (
                        <button
                            key={d}
                            onClick={() => setPeriod(d)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${period === d
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {d}D
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatCompactCurrency}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#e2e8f0'
                            }}
                            formatter={(value: number) => [formatAmount(value), 'Potential Savings']}
                        />
                        <Area
                            type="monotone"
                            dataKey="totalSavings"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#savingsGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">
                        {formatCompactCurrency(data[data.length - 1]?.totalSavings || 0)}
                    </p>
                    <p className="text-xs text-slate-400">Current</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-amber-400">
                        {data[data.length - 1]?.zombieCount || 0}
                    </p>
                    <p className="text-xs text-slate-400">Issues</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">
                        {data[data.length - 1]?.activeCount || 0}
                    </p>
                    <p className="text-xs text-slate-400">Healthy</p>
                </div>
            </div>
        </Card>
    );
}

export default SavingsHistoryChart;
