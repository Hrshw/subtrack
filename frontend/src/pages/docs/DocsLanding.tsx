import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

const DocsLanding = () => {
    return (
        <>
            <Helmet>
                <title>SubTrack Documentation - Save Money on SaaS</title>
                <meta name="description" content="Official documentation for SubTrack. Learn how to connect services, find zombie subscriptions, and save thousands on your SaaS bills." />
                <meta property="og:title" content="SubTrack Documentation" />
                <meta property="og:description" content="Master your SaaS spending with SubTrack's comprehensive guides." />
            </Helmet>

            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        SubTrack Documentation
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        Everything you need to know to stop wasting money on unused developer tools and subscriptions.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <Link to="/docs/getting-started" className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-900/10 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Quick Start</h3>
                        <p className="text-slate-400">Connect your first provider and find savings in under 2 minutes.</p>
                        <div className="mt-4 flex items-center text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Get started <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Link>

                    <Link to="/docs/integrations/github" className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/10 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Integrations</h3>
                        <p className="text-slate-400">Detailed guides for connecting GitHub, Vercel, AWS, and more.</p>
                        <div className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            View integrations <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Link>

                    <Link to="/docs/security-privacy" className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Security</h3>
                        <p className="text-slate-400">Learn how we protect your data with bank-level encryption.</p>
                        <div className="mt-4 flex items-center text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Read security policy <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </Link>
                </div>

                <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                    <h2 className="text-2xl font-bold text-white mb-4">Need help?</h2>
                    <p className="text-slate-400 mb-6">
                        Can't find what you're looking for? Our support team is here to help you save money.
                    </p>
                    <a href="mailto:support@untuuga.resend.app" className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors">
                        Contact Support
                    </a>
                </div>
            </div>
        </>
    );
};

export default DocsLanding;
