import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api';
import { useAuth } from "@clerk/clerk-react";
import {
    MessageSquare,
    Users,
    Calendar,
    Search,
    CheckCircle,
    Clock,
    Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useCurrency } from '../contexts/CurrencyContext';

interface Feedback {
    _id: string;
    name: string;
    email: string;
    message: string;
    category: string;
    status: string;
    createdAt: string;
}

interface WaitlistEntry {
    _id: string;
    email: string;
    expectedSavings: number;
    position: number;
    createdAt: string;
}

const AdminFeedback = () => {
    const { getToken } = useAuth();
    const { formatAmount } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [userCount, setUserCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'feedback' | 'waitlist'>('feedback');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = await getToken();
            const response = await axios.get(`${getApiUrl()}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(response.data.feedbacks);
            setWaitlist(response.data.waitlist);
            setUserCount(response.data.userCount);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const updateFeedbackStatus = async (id: string, status: string) => {
        try {
            const token = await getToken();
            await axios.patch(`${getApiUrl()}/admin/feedback/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, status } : f));
            toast.success(`Status updated to ${status}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredFeedback = feedbacks.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredWaitlist = waitlist.filter(w =>
        w.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0e17] text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Admin Central
                        </h1>
                        <p className="text-slate-400 mt-2">Manage user interactions and growth.</p>
                    </div>

                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('feedback')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'feedback'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Feedback ({feedbacks.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('waitlist')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'waitlist'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Waitlist ({waitlist.length})
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-2 text-emerald-400">
                            <Users className="w-5 h-5" />
                            <span className="text-sm font-medium text-slate-400">Total Users</span>
                        </div>
                        <div className="text-3xl font-bold">{userCount}</div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-2 text-cyan-400">
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium text-slate-400">Total Feedback</span>
                        </div>
                        <div className="text-3xl font-bold">{feedbacks.length}</div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-2 text-amber-400">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium text-slate-400">Pending Actions</span>
                        </div>
                        <div className="text-3xl font-bold">{feedbacks.filter(f => f.status === 'new').length}</div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all backdrop-blur-sm"
                    />
                </div>

                {/* List View */}
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {activeTab === 'feedback' ? (
                            filteredFeedback.map((item) => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-emerald-400">
                                                {item.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{item.name}</h3>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-sm text-slate-400 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {item.email}
                                                    </span>
                                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                item.status === 'processed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-slate-800 text-slate-500 border border-white/5'
                                                }`}>
                                                {item.status}
                                            </span>
                                            {item.status === 'new' && (
                                                <button
                                                    onClick={() => updateFeedbackStatus(item._id, 'processed')}
                                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-slate-950"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 rounded-xl bg-black/20 text-slate-300 leading-relaxed italic border-l-2 border-emerald-500/50">
                                        "{item.message}"
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <span className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                                            Category: {item.category}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            filteredWaitlist.map((item) => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400">
                                            #{item.position}
                                        </div>
                                        <div>
                                            <div className="text-lg font-medium">{item.email}</div>
                                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                                                <span>Expected Savings: {formatAmount(item.expectedSavings)}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400">
                                        <Mail className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))
                        )}

                        {((activeTab === 'feedback' && filteredFeedback.length === 0) ||
                            (activeTab === 'waitlist' && filteredWaitlist.length === 0)) && (
                                <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                                    <div className="text-slate-600 mb-2">No results found</div>
                                    <div className="text-xs text-slate-700">Try adjusting your search terms</div>
                                </div>
                            )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminFeedback;
