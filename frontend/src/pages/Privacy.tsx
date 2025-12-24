import Navbar from '../components/Navbar';

const Privacy = () => {

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
                <p className="text-slate-400 mb-8">Last updated: January 21, 2025</p>

                <div className="prose prose-invert prose-emerald max-w-none">
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8 backdrop-blur-xl mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">TL;DR</h2>
                        <ul className="text-slate-300 space-y-2">
                            <li>✅ We only request <strong>read-only</strong> access to your dev tools</li>
                            <li>✅ All API tokens are encrypted with AES-256</li>
                            <li>✅ We can't delete, modify, or access private data</li>
                            <li>✅ Revoke access anytime with one click</li>
                            <li>✅ GDPR & India Data Protection Act compliant</li>
                        </ul>
                    </div>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <div className="text-slate-300 space-y-4">
                            <p><strong>Account Information:</strong> Email, name (from Clerk authentication)</p>
                            <p><strong>Connected Services:</strong> When you connect GitHub, Vercel, AWS, etc., we store:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Encrypted OAuth tokens (never stored in plaintext)</li>
                                <li>Usage metadata (bandwidth, commits, events)</li>
                                <li>Plan information (Free, Pro, Team)</li>
                            </ul>
                            <p><strong>What We DON'T Collect:</strong></p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Source code or repository contents</li>
                                <li>Private messages or emails</li>
                                <li>Credit card details (handled by Stripe)</li>
                                <li>Passwords</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">2. How We Use Your Data</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>We use your information to:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Analyze your dev tool usage and identify savings opportunities</li>
                                <li>Generate AI-powered recommendations (via Google Gemini)</li>
                                <li>Send email reports about potential leaks</li>
                                <li>Process payments (via Stripe)</li>
                                <li>Improve our service</li>
                            </ul>
                            <p className="font-semibold text-emerald-400">We NEVER sell your data to third parties.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">3. Data Security</h2>
                        <div className="text-slate-300 space-y-4">
                            <p><strong>Encryption:</strong> All OAuth tokens are encrypted using AES-256 before storage in MongoDB.</p>
                            <p><strong>Read-Only Access:</strong> We only request read permissions. We cannot:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Delete your repositories</li>
                                <li>Modify your deployments</li>
                                <li>Access private environment variables</li>
                                <li>Make changes to your billing</li>
                            </ul>
                            <p><strong>Third-Party Services:</strong></p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Clerk (authentication)</li>
                                <li>Stripe (payments)</li>
                                <li>Google Gemini (AI recommendations)</li>
                                <li>MongoDB Atlas (encrypted database)</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">4. Your Rights (GDPR & India DPA)</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>You have the right to:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li><strong>Access:</strong> Request a copy of all your data</li>
                                <li><strong>Delete:</strong> Delete your account and all associated data</li>
                                <li><strong>Revoke:</strong> Disconnect any service with one click</li>
                                <li><strong>Export:</strong> Download your scan history and reports</li>
                                <li><strong>Object:</strong> Opt-out of email reports</li>
                            </ul>
                            <p>To exercise these rights, email <a href="mailto:support@untuuga.resend.app" className="text-emerald-400 hover:underline">support@untuuga.resend.app</a></p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">5. Data Retention</h2>
                        <div className="text-slate-300 space-y-4">
                            <p><strong>Active Users:</strong> We retain your data as long as your account is active.</p>
                            <p><strong>Deleted Accounts:</strong> All data is permanently deleted within 30 days of account deletion.</p>
                            <p><strong>Revoking Services:</strong> When you disconnect a service, we immediately delete the OAuth token and associated usage data.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">6. Cookies</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>We use essential cookies for:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Authentication (Clerk session)</li>
                                <li>Analytics (anonymous usage statistics)</li>
                            </ul>
                            <p>No third-party advertising cookies.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">7. International Data Transfers</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>Your data may be processed in:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>India (primary region)</li>
                                <li>EU (MongoDB Atlas clusters)</li>
                                <li>US (Stripe, Clerk, Google Gemini)</li>
                            </ul>
                            <p>All transfers comply with GDPR standard contractual clauses.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">8. Updates to This Policy</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>We may update this Privacy Policy from time to time. We'll notify you via email for significant changes.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">9. Contact Us</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>For privacy concerns:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Email: <a href="mailto:support@untuuga.resend.app" className="text-emerald-400 hover:underline">support@untuuga.resend.app</a></li>
                                <li>Support: <a href="/support" className="text-emerald-400 hover:underline">Help Center</a></li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 mt-20 py-8 bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex justify-center space-x-6 text-sm text-slate-400">
                        <a href="/privacy" className="hover:text-white">Privacy</a>
                        <a href="/terms" className="hover:text-white">Terms</a>
                        <a href="/eula" className="hover:text-white">EULA</a>
                        <a href="/support" className="hover:text-white">Support</a>
                    </div>
                    <p className="mt-4 text-slate-500 text-sm">© 2025 SubTrack. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Privacy;
