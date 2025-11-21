import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const DocsGettingStarted = () => {
    return (
        <>
            <Helmet>
                <title>Getting Started - SubTrack Documentation</title>
                <meta name="description" content="Start saving money in minutes. Learn how to set up SubTrack and connect your first SaaS provider." />
            </Helmet>

            <div className="prose prose-invert prose-emerald max-w-none">
                <h1 className="text-4xl font-bold text-white mb-6">Getting Started with SubTrack</h1>

                <p className="text-xl text-slate-400 mb-8">
                    Welcome to SubTrack! This guide will help you set up your account, connect your services, and start finding zombie subscriptions in minutes.
                </p>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm">1</span>
                            Create your account
                        </h2>
                        <p className="text-slate-400 mb-4">
                            Sign up for SubTrack using your email or Google account. We use Clerk for secure authentication.
                        </p>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                            <p className="text-sm text-slate-500">💡 Tip: Use your work email if you're tracking company expenses.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm">2</span>
                            Connect a provider
                        </h2>
                        <p className="text-slate-400 mb-4">
                            From your dashboard, click "Connect New Service". Choose a provider like GitHub, Vercel, or AWS. You'll need to grant read-only access.
                        </p>
                        <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                            <li><strong>GitHub:</strong> We scan for inactive seats and unused Copilot licenses.</li>
                            <li><strong>Vercel:</strong> We check for over-provisioned resources and idle projects.</li>
                            <li><strong>AWS:</strong> We look for idle EC2 instances and unattached EBS volumes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm">3</span>
                            Review your savings
                        </h2>
                        <p className="text-slate-400 mb-4">
                            Once connected, SubTrack instantly scans your usage. You'll see a report of "Active Leaks" (money wasting) and "Healthy Resources" (optimized).
                        </p>
                        <p className="text-slate-400">
                            Click on any leak to see details and instructions on how to fix it.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-4">Next Steps</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link to="/docs/integrations/github" className="block p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                            <div className="font-semibold text-white">Connect GitHub</div>
                            <div className="text-sm text-slate-400">Learn about GitHub permissions</div>
                        </Link>
                        <Link to="/docs/integrations/aws" className="block p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                            <div className="font-semibold text-white">Connect AWS</div>
                            <div className="text-sm text-slate-400">Setup IAM roles for scanning</div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DocsGettingStarted;
