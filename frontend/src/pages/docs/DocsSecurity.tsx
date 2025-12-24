import { Helmet } from 'react-helmet-async';
import { Shield, Lock, Eye, Server } from 'lucide-react';

const DocsSecurity = () => {
    return (
        <>
            <Helmet>
                <title>Security & Privacy - SubTrack Documentation</title>
                <meta name="description" content="Learn how SubTrack protects your data with bank-level encryption and read-only access policies." />
            </Helmet>

            <div className="prose prose-invert prose-emerald max-w-none">
                <h1 className="text-4xl font-bold text-white mb-6">Security & Privacy</h1>
                <p className="text-xl text-slate-400 mb-12">
                    Security is our top priority. We use industry-standard encryption and strict access controls to ensure your data is safe.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Encryption at Rest</h3>
                        <p className="text-slate-400">
                            All sensitive data, including API keys and access tokens, is encrypted using AES-256 before being stored in our database.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Read-Only Access</h3>
                        <p className="text-slate-400">
                            We only request read-only permissions from your connected services. We can scan your usage, but we cannot modify your infrastructure or code.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                            <Server className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Data Isolation</h3>
                        <p className="text-slate-400">
                            Your data is logically isolated from other users. We strictly enforce tenant isolation in our application logic.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">SOC 2 Compliance</h3>
                        <p className="text-slate-400">
                            We are working towards SOC 2 Type II compliance. Our infrastructure is hosted on AWS and Vercel, which are SOC 2 compliant.
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
                <p className="text-slate-400 mb-4">
                    We retain your scan history to provide you with savings trends over time. You can request to delete your account and all associated data at any time from the Settings page.
                </p>
                <p className="text-slate-400">
                    When you delete your account, we permanently remove:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-8">
                    <li>All stored API keys and tokens</li>
                    <li>All scan results and history</li>
                    <li>Your user profile information</li>
                </ul>

                <h2 className="text-2xl font-bold text-white mb-4">Vulnerability Disclosure</h2>
                <p className="text-slate-400">
                    If you discover a security vulnerability, please report it to <a href="mailto:support@untuuga.resend.app" className="text-emerald-400 hover:underline">support@untuuga.resend.app</a>. We will respond within 24 hours.
                </p>
            </div>
        </>
    );
};

export default DocsSecurity;
