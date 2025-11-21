import Navbar from '../components/Navbar';

const EULA = () => {

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <h1 className="text-5xl font-bold text-white mb-4">End User License Agreement (EULA)</h1>
                <p className="text-slate-400 mb-8">Last updated: January 21, 2025</p>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 backdrop-blur-xl mb-10">
                    <h2 className="text-2xl font-bold text-emerald-400 mb-3">TL;DR — The Simple Version</h2>
                    <ul className="text-slate-200 space-y-2 text-lg">
                        <li>✅ <strong>Read-only access</strong> — We can't delete or modify anything</li>
                        <li>✅ <strong>You own your data</strong> — We're just analyzing it</li>
                        <li>✅ <strong>Revoke anytime</strong> — One click to disconnect</li>
                        <li>✅ <strong>No hidden fees</strong> — What you see is what you pay</li>
                        <li>✅ <strong>Cancel anytime</strong> — No questions asked</li>
                    </ul>
                </div>

                <div className="prose prose-invert prose-emerald max-w-none text-slate-300">
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">1. Grant of License</h2>
                        <p>SubTrack grants you a non-exclusive, non-transferable, revocable license to use the Service subject to these terms.</p>
                        <p className="mt-4"><strong>You may:</strong></p>
                        <ul className="list-disc ml-6 space-y-2 mt-2">
                            <li>Connect your developer tools for analysis</li>
                            <li>Receive recommendations and reports</li>
                            <li>Export your scan history</li>
                        </ul>
                        <p className="mt-4"><strong>You may NOT:</strong></p>
                        <ul className="list-disc ml-6 space-y-2 mt-2">
                            <li>Share your account credentials</li>
                            <li>Reverse engineer the Service</li>
                            <li>Resell or redistribute our recommendations</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">2. Read-Only Access</h2>
                        <p className="font-semibold text-emerald-400">SubTrack ONLY requests read-only permissions.</p>
                        <p className="mt-4">We can:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-2">
                            <li>View your repository names and commit history (GitHub)</li>
                            <li>Read deployment statistics and bandwidth usage (Vercel)</li>
                            <li>Check error event counts (Sentry)</li>
                            <li>Analyze billing metadata from connected services</li>
                        </ul>
                        <p className="mt-4 font-semibold">We CANNOT:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-2">
                            <li>Delete repositories or deployments</li>
                            <li>Access source code or environment variables</li>
                            <li>Modify your billing or subscription settings</li>
                            <li>Make changes on your behalf</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">3. Data Ownership</h2>
                        <p><strong>YOU own your data.</strong> We are merely processing it to provide analysis.</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>You retain all rights to your repositories, deployments, and account data</li>
                            <li>We store only metadata necessary for leak detection</li>
                            <li>You can delete all your data by closing your account</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">4. Revocation</h2>
                        <p>You can revoke SubTrack's access at any time:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li><strong>From SubTrack:</strong> Settings → Connected Services → Revoke</li>
                            <li><strong>From the service directly:</strong>
                                <ul className="list-circle ml-6 mt-2">
                                    <li>GitHub: Settings → Applications → SubTrack → Revoke</li>
                                    <li>Vercel: Dashboard → Integrations → Remove</li>
                                </ul>
                            </li>
                        </ul>
                        <p className="mt-4">Upon revocation, we immediately delete your encrypted tokens and stop all scans.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">5. Service Updates</h2>
                        <p>We may update SubTrack from time to time to:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Add new integrations</li>
                            <li>Improve AI recommendations</li>
                            <li>Fix bugs and security issues</li>
                            <li>Enhance performance</li>
                        </ul>
                        <p className="mt-4">Updates do not require your explicit consent but will not change core permissions (read-only access).</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">6. Disclaimer of Warranties</h2>
                        <p className="font-semibold">SubTrack is provided "AS IS" without warranties of any kind.</p>
                        <p className="mt-4">We do not guarantee:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-2">
                            <li>That recommendations will result in specific savings</li>
                            <li>100% uptime or availability</li>
                            <li>Compatibility with all third-party services</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                        <p>SubTrack's liability is limited to the fees you paid in the last 12 months. We are not liable for:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Loss of data due to third-party service issues</li>
                            <li>Financial decisions based on our recommendations</li>
                            <li>Indirect or consequential damages</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">8. Termination</h2>
                        <p>This license terminates immediately if you:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Cancel your subscription</li>
                            <li>Violate the Terms of Service</li>
                            <li>Engage in prohibited activities</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">9. Governing Law</h2>
                        <p>This EULA is governed by the laws of India.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">10. Contact</h2>
                        <p>Questions about this EULA?</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Email: <a href="mailto:legal@subtrack.app" className="text-emerald-400 hover:underline">legal@subtrack.app</a></li>
                            <li>Support: <a href="/support" className="text-emerald-400 hover:underline">Help Center</a></li>
                        </ul>
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

export default EULA;
