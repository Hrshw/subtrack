import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="border-t border-slate-800 mt-auto py-12 bg-slate-950/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <img
                                src="/logo/logo-subTrack.jpg"
                                alt="SubTrack Logo"
                                className="w-8 h-8 rounded-lg"
                            />
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                SubTrack
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Stop wasting money on dev tools you forgot about. Find and cancel zombie subscriptions in minutes.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/pricing" className="text-slate-400 hover:text-emerald-400 transition-colors">Pricing</Link></li>
                            <li><Link to="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors">Dashboard</Link></li>
                            <li><Link to="/docs" className="text-slate-400 hover:text-emerald-400 transition-colors">Documentation</Link></li>
                            <li><Link to="/docs/integrations/github" className="text-slate-400 hover:text-emerald-400 transition-colors">Integrations</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/eula" className="text-slate-400 hover:text-emerald-400 transition-colors">EULA</Link></li>
                            <li><Link to="/docs/security-privacy" className="text-slate-400 hover:text-emerald-400 transition-colors">Security</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/support" className="text-slate-400 hover:text-emerald-400 transition-colors">Help Center</Link></li>
                            <li><Link to="/docs/faq" className="text-slate-400 hover:text-emerald-400 transition-colors">FAQ</Link></li>
                            <li><a href="mailto:support@subtrack.app" className="text-slate-400 hover:text-emerald-400 transition-colors">Contact Us</a></li>
                            <li><a href="https://twitter.com/subtrackapp" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">Twitter</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} SubTrack. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs text-emerald-500 font-medium">All Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
