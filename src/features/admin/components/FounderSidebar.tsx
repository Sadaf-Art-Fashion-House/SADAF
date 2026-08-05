'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Cpu, Store, Shirt, LogOut, Crown, Compass, Brush, Menu, X, FileWarning, Mail, TrendingUp, Trophy } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { getUnreadErrorCount } from '@/features/error-logging';

export default function FounderSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadErrors, setUnreadErrors] = useState(0);

    // Refresh unread count every 15 seconds
    useEffect(() => {
        getUnreadErrorCount().then(setUnreadErrors);
        const interval = setInterval(() => {
            getUnreadErrorCount().then(setUnreadErrors);
        }, 15_000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (href: string) => {
        if (href === ROUTES.DASHBOARD) return pathname === ROUTES.DASHBOARD;
        return pathname.startsWith(href);
    };

    const links: Array<{
        href: string;
        label: string;
        icon: LucideIcon;
        badge?: number;
    }> = [
        { href: ROUTES.DASHBOARD, label: 'Dashboard Home', icon: LayoutDashboard },
        { href: ROUTES.DASHBOARD_FOUNDER, label: 'Full Dashboard', icon: Compass },
        { href: ROUTES.DASHBOARD_FOUNDER_ANALYTICS, label: 'Analytics', icon: TrendingUp },
        { href: ROUTES.DASHBOARD_FOUNDER_ERROR_LOGS, label: 'Error Logs', icon: FileWarning, badge: unreadErrors },
        { href: ROUTES.DASHBOARD_FOUNDER_EMAIL_SETTINGS, label: 'Email Settings', icon: Mail },
        { href: ROUTES.DASHBOARD_FOUNDER_LEADERBOARD, label: 'Leaderboard', icon: Trophy },
        { href: ROUTES.STORE, label: 'Store', icon: Store },
        { href: ROUTES.AI_STUDIO, label: 'AI Studio', icon: Cpu },
        { href: ROUTES.ATELIER, label: 'Atelier', icon: Brush },
        { href: ROUTES.ARTWORKS, label: 'Artworks', icon: Shirt },
    ];

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 w-full mb-6">
                <span className="w-16 flex justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center">
                        <Crown size={14} className="text-[#0A0F2C]" />
                    </div>
                </span>
                <span className="text-[9px] font-mono font-bold text-[#FFD700] uppercase tracking-widest truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Founder
                </span>
            </div>

            <nav className="flex flex-col gap-1 w-full flex-1">
                {links.map((link) => {
                    const active = isActive(link.href);
                    const hasBadge = link.badge !== undefined && link.badge > 0;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 py-2 w-full transition-all duration-200 relative ${
                                active
                                    ? 'bg-[#FFD700]/10 text-[#FFD700]'
                                    : 'text-[#E8E0D5]/40 hover:text-white hover:bg-white/5'
                            }`}
                            title={link.label}
                        >
                            <span className="w-16 flex justify-center shrink-0 relative">
                                <link.icon size={16} />
                                {hasBadge && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                )}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                                {link.label}
                                {hasBadge && (
                                    <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-red-500/20 text-red-400 text-[7px] font-bold font-mono">
                                        {link.badge! > 9 ? '9+' : link.badge}
                                    </span>
                                )}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <Link
                href={ROUTES.AUTH}
                className="flex items-center gap-3 py-2 w-full text-red-400/50 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200"
                title="Sign In"
            >
                <span className="w-16 flex justify-center shrink-0">
                    <LogOut size={16} className="rotate-180" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Sign In
                </span>
            </Link>
        </>
    );

    const mobileLink = (link: (typeof links)[number]) => {
        const active = isActive(link.href);
        const hasBadge = link.badge !== undefined && link.badge > 0;
        return (
            <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    active
                        ? 'bg-[#FFD700]/10 text-[#FFD700]'
                        : 'text-[#E8E0D5]/40 hover:text-white hover:bg-white/5'
                }`}
            >
                <div className="relative">
                    <link.icon size={16} className="shrink-0" />
                    {hasBadge && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400" />
                    )}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider truncate flex items-center gap-2">
                    {link.label}
                    {hasBadge && (
                        <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-red-500/20 text-red-400 text-[7px] font-bold font-mono">
                            {link.badge && link.badge > 9 ? '9+' : link.badge}
                        </span>
                    )}
                </span>
            </Link>
        );
    };

    return (
        <>
            <aside className="hidden md:flex md:flex-col sticky top-0 self-start w-16 hover:w-56 bg-[#05081A]/95 border-r border-[#FFD700]/10 max-h-screen py-4 z-30 transition-all duration-300 overflow-hidden group">
                {sidebarContent}
            </aside>

            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed bottom-5 right-5 w-12 h-12 rounded-full bg-[#FFD700] text-[#0A0F2C] flex items-center justify-center shadow-lg shadow-[#FFD700]/30 z-50 hover:scale-105 transition-transform"
                aria-label="Open navigation menu"
            >
                <Menu size={20} />
            </button>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#05081A]/98 border-r border-[#FFD700]/20 z-50 flex flex-col py-6 px-4"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="self-end p-1.5 rounded-lg text-[#E8E0D5]/60 hover:text-white hover:bg-white/5 transition-all"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                            <div className="w-full mt-4">
                                <div className="flex items-center gap-3 w-full mb-6">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center">
                                        <Crown size={14} className="text-[#0A0F2C]" />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-[#FFD700] uppercase tracking-widest">Founder</span>
                                </div>
                                <nav className="flex flex-col gap-1 w-full">
                                    {links.map(mobileLink)}
                                </nav>
                                <Link
                                    href={ROUTES.AUTH}
                                    className="flex items-center gap-3 w-full mt-4 px-3 py-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-950/20 transition-all"
                                >
                                    <LogOut size={16} className="shrink-0 rotate-180" />
                                    <span className="text-[10px] font-mono uppercase tracking-wider">Sign In</span>
                                </Link>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
