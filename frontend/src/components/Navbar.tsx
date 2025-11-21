import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
    const { isSignedIn } = useAuth();

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/5 bg-slate-950/50 supports-[backdrop-filter]:bg-slate-950/20"
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:to-white transition-all">
                        SubTrack
                    </span>
                </Link>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <Link to="/demo" className="hover:text-white transition-colors hover:scale-105 transform">
                        Demo
                    </Link>
                    <Link to="/pricing" className="hover:text-white transition-colors hover:scale-105 transform">
                        Pricing
                    </Link>
                    <Link to="/docs" className="hover:text-white transition-colors hover:scale-105 transform">
                        Docs
                    </Link>
                    <Link to="/support" className="hover:text-white transition-colors hover:scale-105 transform">
                        Support
                    </Link>
                    {isSignedIn ? (
                        <>
                            <Link to="/dashboard" className="hover:text-white transition-colors hover:scale-105 transform">
                                Dashboard
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </>
                    ) : (
                        <>
                            <Link to="/sign-in" className="hover:text-white transition-colors hover:scale-105 transform">
                                Login
                            </Link>
                            <Link to="/sign-up">
                                <Button size="sm" className="bg-white text-slate-950 hover:bg-emerald-50 hover:text-emerald-900 font-bold px-6 rounded-full transition-all shadow-lg shadow-white/10 hover:shadow-white/20">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </motion.header>
    );
};

export default Navbar;

