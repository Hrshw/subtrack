import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Github,
    Server,
    Database,
    RefreshCw,
    Plus,
    Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';

// Mock Data for Demo
const MOCK_CONNECTIONS = [
    { id: '1', type: 'github', name: 'rahul-dev', status: 'connected', lastScanned: new Date().toISOString() },
    { id: '2', type: 'vercel', name: 'rahul-projects', status: 'connected', lastScanned: new Date().toISOString() },
    { id: '3', type: 'aws', name: 'AWS-Prod', status: 'error', lastScanned: null },
];

const MOCK_RESULTS = [
    { id: '1', resourceName: 'legacy-api-v1', resourceType: 'repository', status: 'zombie', potentialSavings: 700, currency: 'USD', reason: 'No commits in 145 days', connectionId: '1' },
    { id: '2', resourceName: 'dev-db-instance-xl', resourceType: 'database', status: 'unused', potentialSavings: 1200, currency: 'USD', reason: '0 connections in 30 days', connectionId: '3' },
    { id: '3', resourceName: 'image-optimizer-lambda', resourceType: 'function', status: 'downgrade_possible', potentialSavings: 350, currency: 'USD', reason: 'Usage < 5% of provisioned capacity', connectionId: '3' },
];

const Demo = () => {
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState(MOCK_RESULTS);

    const handleScan = () => {
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            // Simulate finding a new result
            setResults(prev => [
                { id: Date.now().toString(), resourceName: 'forgotten-s3-bucket', resourceType: 'bucket', status: 'zombie', potentialSavings: 45, currency: 'USD', reason: 'No access logs in 90 days', connectionId: '3' },
                ...prev
            ]);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
            <Navbar />
            
            {/* Demo Banner */}
            <div className="fixed top-20 left-0 right-0 z-40 bg-emerald-500/10 border-b border-emerald-500/20 py-2 text-center text-sm text-emerald-400 font-medium">
                You are viewing the Live Demo. Data is simulated. <Link to="/sign-up" className="underline hover:text-white">Create an account</Link> to scan your real infrastructure.
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Potential Savings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-white">
                                ${results.reduce((acc, curr) => acc + curr.potentialSavings, 0).toLocaleString()}
                                <span className="text-sm font-normal text-slate-500 ml-2">/mo</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Active Connections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-white">{MOCK_CONNECTIONS.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Zombie Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-emerald-400">{results.filter(r => r.status === 'zombie').length}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Connections Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Connections</h2>
                            <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800">
                                <Plus className="w-4 h-4 mr-2" /> Add New
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {MOCK_CONNECTIONS.map(conn => (
                                <div key={conn.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                            {conn.type === 'github' && <Github className="w-5 h-5" />}
                                            {conn.type === 'vercel' && <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M24 22.525H0l12-21.05 12 21.05z" /></svg>}
                                            {conn.type === 'aws' && <Server className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium capitalize">{conn.type}</div>
                                            <div className="text-xs text-slate-500">{conn.name}</div>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Findings Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Scan Results</h2>
                            <Button
                                onClick={handleScan}
                                disabled={scanning}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                            >
                                {scanning ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4 mr-2" />
                                )}
                                {scanning ? 'Scanning...' : 'Scan Now'}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {results.map((result) => (
                                <motion.div
                                    key={result.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.status === 'zombie' ? 'bg-red-500/10 text-red-400' :
                                                result.status === 'unused' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                {result.resourceType === 'repository' && <Github className="w-5 h-5" />}
                                                {result.resourceType === 'database' && <Database className="w-5 h-5" />}
                                                {result.resourceType === 'function' && <Server className="w-5 h-5" />}
                                                {result.resourceType === 'bucket' && <Database className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{result.resourceName}</h3>
                                                <div className="text-sm text-slate-400 capitalize">{result.resourceType} • {result.reason}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">${result.potentialSavings}</div>
                                            <div className="text-xs text-slate-500">potential savings</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Ignore</Button>
                                        <Button size="sm" variant="destructive" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                                            Remove Resource
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Demo;
