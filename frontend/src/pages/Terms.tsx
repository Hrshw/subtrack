import Navbar from '../components/Navbar';

const Terms = () => {

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
                <p className="text-slate-400 mb-8">Last updated: January 21, 2025</p>

                <div className="prose prose-invert prose-emerald max-w-none text-slate-300">
                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing or using SubTrack ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p>SubTrack is a SaaS platform that analyzes your developer tool usage and identifies cost-saving opportunities. We provide:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Read-only access to connected services (GitHub, Vercel, AWS, etc.)</li>
                            <li>Usage analysis and leak detection</li>
                            <li>AI-powered recommendations</li>
                            <li>Email reports and alerts</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">3. Account Registration</h2>
                        <p>You must provide accurate information when creating an account. You are responsible for:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities under your account</li>
                            <li>Notifying us of unauthorized access</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">4. Subscription Plans</h2>
                        <p><strong>Free Plan:</strong></p>
                        <ul className="list-disc ml-6 space-y-2 mt-2 mb-4">
                            <li>Limited to 3 connected accounts</li>
                            <li>Monthly scans</li>
                            <li>Basic features</li>
                        </ul>
                        <p><strong>Pro Plan (₹799/month or ₹7,999/year):</strong></p>
                        <ul className="list-disc ml-6 space-y-2 mt-2 mb-4">
                            <li>Unlimited connected accounts</li>
                            <li>AI-powered recommendations</li>
                            <li>Real-time monitoring</li>
                            <li>Priority support</li>
                        </ul>
                        <p className="font-semibold text-emerald-400 mt-4">Auto-Renewal: Subscriptions automatically renew unless canceled before the renewal date.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">5. Payment Terms</h2>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>All payments are processed securely via Stripe</li>
                            <li>Prices are in Indian Rupees (INR)</li>
                            <li>We offer a 7-day money-back guarantee for new Pro subscribers</li>
                            <li>Refunds after 7 days are at our discretion</li>
                            <li>We reserve the right to change pricing with 30 days' notice</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">6. Cancellation Policy</h2>
                        <p>You may cancel your subscription at any time from Settings. Upon cancellation:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>You retain access until the end of your billing period</li>
                            <li>No refunds for partial months</li>
                            <li>Your data is deleted 30 days after cancellation</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">7. User Responsibilities</h2>
                        <p>You agree NOT to:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Share your account with others</li>
                            <li>Reverse engineer or attempt to extract source code</li>
                            <li>Use the Service for illegal purposes</li>
                            <li>Upload malicious code or spam</li>
                            <li>Exceed reasonable API usage limits</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">8. Data and Privacy</h2>
                        <p>We collect and process your data as described in our <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a>. Key points:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Read-only access to connected services</li>
                            <li>AES-256 encrypted token storage</li>
                            <li>You can revoke access anytime</li>
                            <li>We don't sell your data</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">9. Service Availability</h2>
                        <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We may:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Perform scheduled maintenance (with notice)</li>
                            <li>Temporarily suspend service for security reasons</li>
                            <li>Modify features with reasonable notice</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">10. Limitation of Liability</h2>
                        <p className="font-semibold">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>SubTrack is provided "AS IS" without warranties</li>
                            <li>We are not liable for indirect, incidental, or consequential damages</li>
                            <li>Our total liability is limited to the amount you paid in the last 12 months</li>
                            <li>We are not responsible for actions taken based on our recommendations</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">11. Termination</h2>
                        <p>We may suspend or terminate your account if you:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-4">
                            <li>Violate these Terms</li>
                            <li>Engage in fraudulent activity</li>
                            <li>Fail to pay subscription fees</li>
                            <li>Abuse our systems or support</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">12. Governing Law</h2>
                        <p>These Terms are governed by the laws of India. Disputes will be resolved in courts of [Your City], India.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">13. Changes to Terms</h2>
                        <p>We may update these Terms from time to time. Significant changes will be notified via email 30 days in advance. Continued use after changes constitutes acceptance.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">14. Contact</h2>
                        <p>For questions about these Terms:</p>
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

export default Terms;
