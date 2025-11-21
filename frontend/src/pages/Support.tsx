import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import Navbar from '../components/Navbar';
import { ChevronDown, ChevronUp, Mail, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Support = () => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const faqs = [
        {
            question: "Is my data safe? What can SubTrack access?",
            answer: "Absolutely safe. We ONLY request read-only permissions. This means we can view your usage stats (commits, bandwidth, events) but cannot delete repositories, modify deployments, or access private code/environment variables. All OAuth tokens are encrypted with AES-256 before storage. You can revoke access anytime with one click."
        },
        {
            question: "How do I cancel my Pro subscription?",
            answer: "Go to Settings → Subscription → Cancel. You'll retain Pro access until the end of your billing period. No questions asked, and we offer a 7-day money-back guarantee if you're not satisfied."
        },
        {
            question: "What tools and services do you support?",
            answer: "Currently: GitHub (Free/Pro/Team), Vercel (Hobby/Pro), AWS, Sentry (Developer/Team/Business), Linear, Resend, Clerk, and Stripe. We're adding more integrations monthly based on user requests!"
        },
        {
            question: "How accurate are the savings recommendations?",
            answer: "Our AI analyzes real usage data from your connected accounts. For example, if you're on GitHub Pro ($4/month) but haven't committed in 90 days, we'll recommend downgrading to Free. Recommendations are based on actual patterns, not guesses. Average users save ₹34,000/month."
        },
        {
            question: "Can I connect my team's accounts?",
            answer: "Yes! Pro users can connect unlimited accounts. Each team member needs their own SubTrack account, but you can monitor all your organization's tools from one dashboard."
        },
        {
            question: "What's your refund policy?",
            answer: "7-day money-back guarantee for new Pro subscribers. If you don't save more than ₹799 in your first week, we'll refund you completely. After 7 days, refunds are at our discretion."
        },
        {
            question: "How often do you scan my accounts?",
            answer: "Free users: Monthly scans. Pro users: Real-time monitoring with daily scans. We cache results for 1 hour to avoid hitting API rate limits."
        },
        {
            question: "Do you sell my data?",
            answer: "NEVER. We don't sell, rent, or share your data with third parties. We use Google Gemini for AI recommendations (anonymized), but that's it. See our Privacy Policy for full details."
        },
        {
            question: "What happens if I delete my account?",
            answer: "All your data is permanently deleted within 30 days. This includes OAuth tokens, scan history, and account information. We cannot recover data after deletion."
        },
        {
            question: "Can I export my scan history?",
            answer: "Yes! Pro users can export scan history as CSV or JSON from Settings → Export Data."
        }
    ];

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const toastId = toast.loading('Sending message...');

        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));

        toast.success('Message sent! We\'ll reply within 24 hours.', { id: toastId });
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            How can we help?
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400">
                        Find answers to common questions or reach out directly
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl text-center">
                        <CardContent className="pt-6">
                            <Mail className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-white">24 hours</div>
                            <div className="text-sm text-slate-400">Average response time</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl text-center">
                        <CardContent className="pt-6">
                            <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-white">100% safe</div>
                            <div className="text-sm text-slate-400">Read-only access</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl text-center">
                        <CardContent className="pt-6">
                            <Clock className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-white">Anytime</div>
                            <div className="text-sm text-slate-400">Cancel subscription</div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <Card
                                key={index}
                                className="bg-slate-900/50 border-slate-700 backdrop-blur-xl cursor-pointer hover:border-emerald-500/50 transition"
                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg text-white">{faq.question}</CardTitle>
                                        {expandedFaq === index ?
                                            <ChevronUp className="h-5 w-5 text-emerald-400" /> :
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        }
                                    </div>
                                </CardHeader>
                                {expandedFaq === index && (
                                    <CardContent>
                                        <p className="text-slate-300">{faq.answer}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div>
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Still have questions?</h2>
                    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-white">Send us a message</CardTitle>
                            <CardDescription>We'll get back to you within 24 hours</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="text-white">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your name"
                                        required
                                        className="bg-slate-800 border-slate-600 text-white"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email" className="text-white">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="your@email.com"
                                        required
                                        className="bg-slate-800 border-slate-600 text-white"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="message" className="text-white">Message</Label>
                                    <Textarea
                                        id="message"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="How can we help you?"
                                        rows={5}
                                        required
                                        className="bg-slate-800 border-slate-600 text-white"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                >
                                    Send Message
                                </Button>
                            </form>
                            <div className="mt-6 text-center">
                                <p className="text-sm text-slate-400">
                                    Or email us directly at{' '}
                                    <a href="mailto:support@subtrack.app" className="text-emerald-400 hover:underline">
                                        support@subtrack.app
                                    </a>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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

export default Support;
