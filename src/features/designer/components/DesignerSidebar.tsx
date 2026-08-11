'use client';

/**
 * SADAF | Designer — Sidebar
 *
 * Persistent navigation for the designer route group (/dashboard/designer).
 * Mirrors the Admin/Founder sidebar pattern (expand-on-hover desktop rail +
 * mobile drawer) with a violet accent to distinguish the designer space.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Palette,
    Store,
    Shirt,
    Brush,
    Menu,
    X,
    Cpu,
    Handshake,
    Wallet,
    Settings,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import SignOutButton from '@/shared/components/SignOutButton';

export default function DesignerSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => pathname.startsWith(href);

    const links: Array<{ href: string; label: string; icon: LucideIcon }> = [
        { href: ROUTES.DASHBOARD_DESIGNER, label: 'Designer Dashboard', icon: LayoutDashboard },
        { href: ROUTES.DASHBOARD_DESIGNER_CONNECTIONS, label: 'Connections', icon: Handshake },
        { href: ROUTES.DASHBOARD_DESIGNER_COMMISSIONS, label: 'Commissions', icon: Wallet },
        { href: ROUTES.AI_STUDIO, label: 'AI Studio', icon: Cpu },
        { href: ROUTES.ATELIER, label: 'Atelier', icon: Brush },
        { href: ROUTES.STORE, label: 'Store', icon: Store },
        { href: ROUTES.ARTWORKS, label: 'Artworks', icon: Shirt },
        { href: ROUTES.DASHBOARD_DESIGNER_SETTINGS, label: 'Settings', icon: Settings },
    ];

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 w-full mb-6">
                <span className="w-16 flex justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#4FC3F7] flex items-center justify-center">
                        <Palette size={14} className="text-[#0A0F2C]" />
                    </div>
                </span>
                <span className="text-[9px] font-mono font-bold text-[#A78BFA] uppercase tracking-widest truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Designer
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
                                    ? 'bg-[#A78BFA]/10 text-[#A78BFA]'
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
                        ? 'bg-[#A78BFA]/10 text-[#A78BFA]'
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
            <aside className="hidden md:flex md:flex-col sticky top-0 self-start w-16 hover:w-56 bg-[#05081A]/95 border-r border-[#A78BFA]/10 max-h-screen py-4 z-30 transition-all duration-300 overflow-hidden group">
                {sidebarContent}
            </aside>

            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed bottom-5 right-5 w-12 h-12 rounded-full bg-[#A78BFA] text-[#0A0F2C] flex items-center justify-center shadow-lg shadow-[#A78BFA]/30 z-50 hover:scale-105 transition-transform"
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
                            className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#05081A]/98 border-r border-[#A78BFA]/20 z-50 flex flex-col py-6 px-4"
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
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#4FC3F7] flex items-center justify-center">
                                        <Palette size={14} className="text-[#0A0F2C]" />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-[#A78BFA] uppercase tracking-widest">Designer</span>
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
