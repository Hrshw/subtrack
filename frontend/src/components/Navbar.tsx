import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { isSignedIn } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/5 bg-slate-950/50 supports-[backdrop-filter]:bg-slate-950/20"
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight group cursor-pointer">
                    <img
                        src="/logo/logo-subTrack.jpg"
                        alt="SubTrack Logo"
                        className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:to-white transition-all">
                        SubTrack
                    </span>
                </Link>

                {/* Desktop Navigation */}
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

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-lg"
                    >
                        <nav className="flex flex-col px-6 py-4 space-y-4">
                            <Link
                                to="/demo"
                                className="text-slate-400 hover:text-white transition-colors py-2"
                                onClick={closeMobileMenu}
                            >
                                Demo
                            </Link>
                            <Link
                                to="/pricing"
                                className="text-slate-400 hover:text-white transition-colors py-2"
                                onClick={closeMobileMenu}
                            >
                                Pricing
                            </Link>
                            <Link
                                to="/docs"
                                className="text-slate-400 hover:text-white transition-colors py-2"
                                onClick={closeMobileMenu}
                            >
                                Docs
                            </Link>
                            <Link
                                to="/support"
                                className="text-slate-400 hover:text-white transition-colors py-2"
                                onClick={closeMobileMenu}
                            >
                                Support
                            </Link>

                            {isSignedIn ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="text-slate-400 hover:text-white transition-colors py-2"
                                        onClick={closeMobileMenu}
                                    >
                                        Dashboard
                                    </Link>
                                    <div className="pt-2 flex items-center gap-3">
                                        <UserButton afterSignOutUrl="/" />
                                        <span className="text-sm text-slate-400">Account</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/sign-in"
                                        className="text-slate-400 hover:text-white transition-colors py-2"
                                        onClick={closeMobileMenu}
                                    >
                                        Login
                                    </Link>
                                    <Link to="/sign-up" onClick={closeMobileMenu}>
                                        <Button className="w-full bg-white text-slate-950 hover:bg-emerald-50 hover:text-emerald-900 font-bold rounded-full">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Navbar;
