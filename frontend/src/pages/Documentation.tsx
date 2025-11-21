import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Shield,
    Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';

const DocSection = ({ title, id, children }: { title: string, id: string, children: React.ReactNode }) => (
    <section id={id} className="mb-16 scroll-mt-24">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">#</span>
            {title}
        </h2>
        <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            {children}
        </div>
    </section>
);

const Documentation = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 flex gap-12">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block w-64 shrink-0 fixed top-32 bottom-0 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
                    <nav className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Getting Started</h3>
                            <ul className="space-y-2 border-l border-slate-800 ml-2">
                                <li><a href="#introduction" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">Introduction</a></li>
                                <li><a href="#quick-start" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">Quick Start Guide</a></li>
                                <li><a href="#installation" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">Installation</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Integrations</h3>
                            <ul className="space-y-2 border-l border-slate-800 ml-2">
                                <li><a href="#github" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">GitHub</a></li>
                                <li><a href="#vercel" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">Vercel</a></li>
                                <li><a href="#aws" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">AWS</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Billing & Plans</h3>
                            <ul className="space-y-2 border-l border-slate-800 ml-2">
                                <li><a href="#pricing" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">Pricing Models</a></li>
                                <li><a href="#cancellation" className="block pl-4 border-l border-transparent hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all">Cancellation Policy</a></li>
                            </ul>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="lg:pl-72 flex-1 min-w-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Documentation</h1>
                        <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                            Everything you need to know about tracking your SaaS subscriptions, finding zombie costs, and optimizing your dev stack spending.
                        </p>

                        <DocSection title="Introduction" id="introduction">
                            <p>
                                SubTrack is an intelligent SaaS management platform designed specifically for developers and indie hackers.
                                We connect directly to your infrastructure providers (like GitHub, Vercel, and AWS) to identify unused resources
                                and "zombie" subscriptions that are draining your bank account.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6 my-8">
                                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                                    <Shield className="w-8 h-8 text-emerald-400 mb-4" />
                                    <h4 className="text-lg font-bold text-white mb-2">Security First</h4>
                                    <p className="text-sm text-slate-400">We use read-only API tokens and AES-256 encryption. We can never modify your code or infrastructure.</p>
                                </div>
                                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                                    <Zap className="w-8 h-8 text-amber-400 mb-4" />
                                    <h4 className="text-lg font-bold text-white mb-2">Instant Results</h4>
                                    <p className="text-sm text-slate-400">Scans take less than 2 minutes. No manual data entry required.</p>
                                </div>
                            </div>
                        </DocSection>

                        <DocSection title="Quick Start Guide" id="quick-start">
                            <ol className="list-decimal list-inside space-y-4 text-slate-300">
                                <li className="pl-2"><span className="text-white font-semibold">Create an account</span> using your email or social login.</li>
                                <li className="pl-2"><span className="text-white font-semibold">Connect your providers</span> via the Dashboard. You'll need to generate read-only API tokens for each service.</li>
                                <li className="pl-2"><span className="text-white font-semibold">Run your first scan</span> by clicking the "Scan Now" button.</li>
                                <li className="pl-2"><span className="text-white font-semibold">Review findings</span> and take action on the identified zombie subscriptions.</li>
                            </ol>
                        </DocSection>

                        <DocSection title="GitHub Integration" id="github">
                            <p className="mb-4">
                                To connect GitHub, you'll need a Personal Access Token (Classic).
                            </p>
                            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 font-mono text-sm text-slate-300 mb-4">
                                Scopes required: repo (read-only), read:user, read:org
                            </div>
                            <p>
                                We analyze your repositories to find:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                                <li>Repos with no commits in {'>'}90 days</li>
                                <li>Paid seats for inactive users</li>
                                <li>Unused GitHub Actions minutes</li>
                            </ul>
                        </DocSection>

                        <DocSection title="Vercel Integration" id="vercel">
                            <p>
                                Connect your Vercel account to discover:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                                <li>Projects with 0 traffic in the last 30 days</li>
                                <li>Over-provisioned bandwidth limits</li>
                                <li>Stalled deployments on paid tiers</li>
                            </ul>
                        </DocSection>

                        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center">
                            <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
                            <p className="text-slate-400 mb-6">Our support team is available 24/7 to help you save money.</p>
                            <Link to="/support">
                                <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
                                    Contact Support
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Documentation;
