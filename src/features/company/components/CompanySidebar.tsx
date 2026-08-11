'use client';

/**
 * SADAF | Company — Sidebar
 *
 * Persistent navigation for the company route group (/dashboard/company).
 * Mirrors the Designer/Admin sidebar pattern (expand-on-hover desktop rail +
 * mobile drawer) with a rose accent to distinguish the company space.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Building2,
    Handshake,
    Store,
    Menu,
    X,
    Settings,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import SignOutButton from '@/shared/components/SignOutButton';

export default function CompanySidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => pathname.startsWith(href);

    const links: Array<{ href: string; label: string; icon: LucideIcon }> = [
        { href: ROUTES.DASHBOARD_COMPANY, label: 'Company Home', icon: LayoutDashboard },
        { href: ROUTES.DASHBOARD_COMPANY_CONNECTIONS, label: 'Connections', icon: Handshake },
        { href: ROUTES.STORE, label: 'Store', icon: Store },
        { href: ROUTES.DASHBOARD_COMPANY_SETTINGS, label: 'Settings', icon: Settings },
    ];

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 w-full mb-6">
                <span className="w-16 flex justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-[#C9A84C] flex items-center justify-center">
                        <Building2 size={14} className="text-[#0A0F2C]" />
                    </div>
                </span>
                <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Company
                </span>
            </div>

            <nav className="flex flex-col gap-1 w-full flex-1">
                {links.map((link) => {
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 py-2 w-full transition-all duration-200 relative ${
                                active
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : 'text-[#E8E0D5]/40 hover:text-white hover:bg-white/5'
                            }`}
                            title={link.label}
                        >
                            <span className="w-16 flex justify-center shrink-0">
                                <link.icon size={16} />
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {link.label}
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
        return (
            <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    active
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'text-[#E8E0D5]/40 hover:text-white hover:bg-white/5'
                }`}
            >
                <link.icon size={16} className="shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-wider truncate">
                    {link.label}
                </span>
            </Link>
        );
    };

    return (
        <>
            <aside className="hidden md:flex md:flex-col sticky top-0 self-start w-16 hover:w-56 bg-[#05081A]/95 border-r border-rose-500/10 max-h-screen py-4 z-30 transition-all duration-300 overflow-hidden group">
                {sidebarContent}
            </aside>

            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed bottom-5 right-5 w-12 h-12 rounded-full bg-rose-500 text-[#0A0F2C] flex items-center justify-center shadow-lg shadow-rose-500/30 z-50 hover:scale-105 transition-transform"
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
                            className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#05081A]/98 border-r border-rose-500/20 z-50 flex flex-col py-6 px-4"
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
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-rose-400 to-[#C9A84C] flex items-center justify-center">
                                        <Building2 size={14} className="text-[#0A0F2C]" />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Company</span>
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
