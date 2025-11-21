import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Book, Shield, HelpCircle, CreditCard, ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import Footer from '../components/Footer';

const DocsLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const links = [
        { to: '/docs', label: 'Introduction', icon: Book },
        { to: '/docs/getting-started', label: 'Getting Started', icon: Book },
        {
            label: 'Integrations',
            items: [
                { to: '/docs/integrations/github', label: 'GitHub' },
                { to: '/docs/integrations/vercel', label: 'Vercel' },
                { to: '/docs/integrations/aws', label: 'AWS' },
                { to: '/docs/integrations/sentry', label: 'Sentry' },
                { to: '/docs/integrations/linear', label: 'Linear' },
                { to: '/docs/integrations/resend', label: 'Resend' },
                { to: '/docs/integrations/clerk', label: 'Clerk' },
                { to: '/docs/integrations/stripe', label: 'Stripe' },
            ]
        },
        { to: '/docs/security-privacy', label: 'Security & Privacy', icon: Shield },
        { to: '/docs/faq', label: 'FAQ', icon: HelpCircle },
        { to: '/docs/pricing', label: 'Pricing', icon: CreditCard },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <HelmetProvider>
            <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col md:flex-row">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo/logo-subTrack.jpg" alt="SubTrack" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold text-white">SubTrack Docs</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </div>

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/50 border-r border-slate-800 backdrop-blur-xl transform transition-transform duration-200 ease-in-out
                    md:translate-x-0 md:static md:h-screen md:overflow-y-auto
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="p-6">
                        <Link to="/" className="flex items-center gap-2 mb-8 hidden md:flex">
                            <img src="/logo/logo-subTrack.jpg" alt="SubTrack" className="w-8 h-8 rounded-lg" />
                            <span className="font-bold text-white text-lg">SubTrack Docs</span>
                        </Link>

                        <nav className="space-y-6">
                            <div className="space-y-1">
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Link>
                            </div>

                            {links.map((link, idx) => (
                                <div key={idx} className="space-y-1">
                                    {link.items ? (
                                        <>
                                            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">
                                                {link.label}
                                            </h3>
                                            {link.items.map((item) => (
                                                <Link
                                                    key={item.to}
                                                    to={item.to}
                                                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive(item.to)
                                                        ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                        }`}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </>
                                    ) : (
                                        <Link
                                            to={link.to!}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isActive(link.to!)
                                                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                }`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.icon && <link.icon className="w-4 h-4" />}
                                            {link.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-6 py-12 md:px-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </div>

                    <Footer />
                </main>
            </div>
        </HelmetProvider>
    );
};

export default DocsLayout;
