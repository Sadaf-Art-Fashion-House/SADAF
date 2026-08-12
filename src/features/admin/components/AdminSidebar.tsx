'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Cpu,
    Store,
    Shirt,
    Shield,
    Compass,
    Brush,
    Menu,
    X,
    FileWarning,
    Mail,
    TrendingUp,
    Trophy,
    Users,
    Settings,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { getUnreadErrorCount } from '@/features/error-logging';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import SignOutButton from '@/shared/components/SignOutButton';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
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
        { href: ROUTES.DASHBOARD, label: t('admin.sidebar.dashboardHome'), icon: LayoutDashboard },
        { href: ROUTES.DASHBOARD_ADMIN, label: t('admin.sidebar.fullDashboard'), icon: Compass },
        { href: ROUTES.DASHBOARD_ADMIN_ANALYTICS, label: t('admin.sidebar.analytics'), icon: TrendingUp },
        { href: ROUTES.DASHBOARD_ERROR_LOGS, label: t('admin.sidebar.errorLogs'), icon: FileWarning, badge: unreadErrors },
        { href: ROUTES.DASHBOARD_EMAIL_SETTINGS, label: t('admin.sidebar.emailSettings'), icon: Mail },
        { href: ROUTES.DASHBOARD_ADMIN_LEADERBOARD, label: t('admin.sidebar.leaderboard'), icon: Trophy },
        { href: ROUTES.DASHBOARD_ADMIN_COMMUNITY, label: t('admin.sidebar.community'), icon: Users },
        { href: ROUTES.STORE, label: t('nav.store'), icon: Store },
        { href: ROUTES.AI_STUDIO, label: t('nav.aiStudio'), icon: Cpu },
        { href: ROUTES.ATELIER, label: t('nav.atelier'), icon: Brush },
        { href: ROUTES.ARTWORKS, label: t('nav.arts'), icon: Shirt },
        { href: ROUTES.DASHBOARD_ADMIN_SETTINGS, label: t('admin.sidebar.settings'), icon: Settings },
    ];

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 w-full mb-6">
                <span className="w-16 flex justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1B2A6B] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                    </div>
                </span>
                <span className="text-[9px] font-mono font-bold text-[#4FC3F7] uppercase tracking-widest truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {t('admin.sidebar.roleAdmin')}
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
                                    ? 'bg-[#4FC3F7]/10 text-[#4FC3F7]'
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

            <SignOutButton />
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
                        ? 'bg-[#4FC3F7]/10 text-[#4FC3F7]'
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
            <aside className="hidden md:flex md:flex-col sticky top-0 self-start w-16 hover:w-56 bg-[#05081A]/95 border-r border-[#4FC3F7]/10 max-h-screen py-4 z-30 transition-all duration-300 overflow-hidden group">
                {sidebarContent}
            </aside>

            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed bottom-5 right-5 w-12 h-12 rounded-full bg-[#4FC3F7] text-[#0A0F2C] flex items-center justify-center shadow-lg shadow-[#4FC3F7]/30 z-50 hover:scale-105 transition-transform"
                aria-label={t('common.openMenu')}
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
                            className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#05081A]/98 border-r border-[#4FC3F7]/20 z-50 flex flex-col py-6 px-4"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="self-end p-1.5 rounded-lg text-[#E8E0D5]/60 hover:text-white hover:bg-white/5 transition-all"
                                aria-label={t('common.closeMenu')}
                            >
                                <X size={18} />
                            </button>
                            <div className="w-full mt-4">
                                <div className="flex items-center gap-3 w-full mb-6">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1B2A6B] flex items-center justify-center">
                                        <Shield size={14} className="text-white" />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-[#4FC3F7] uppercase tracking-widest">{t('admin.sidebar.roleAdmin')}</span>
                                </div>
                                <nav className="flex flex-col gap-1 w-full">
                                    {links.map(mobileLink)}
                                </nav>
                                <SignOutButton variant="mobile" onSignedOut={() => setMobileOpen(false)} />
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
