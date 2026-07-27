'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Cpu, Store, Shirt, LogOut, Shield, Compass, Menu, X } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const links = [
        { href: '/dashboard', label: 'Dashboard Home', icon: LayoutDashboard },
        { href: '/dashboard/admin', label: 'Full Dashboard', icon: Compass },
        { href: '/store', label: 'Store', icon: Store },
        { href: '/ai', label: 'AI Studio', icon: Cpu },
        { href: '/artworks', label: 'Artworks', icon: Shirt },
    ];

    const sidebarContent = (
        <>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#1B2A6B] flex items-center justify-center mb-6">
                <Shield size={14} className="text-white" />
            </div>
            <nav className="flex flex-col gap-3 items-center flex-1">
                {links.map((link) => {
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`p-2 rounded-lg transition-all ${
                                active
                                    ? 'bg-[#4FC3F7]/10 text-[#4FC3F7]'
                                    : 'text-[#E8E0D5]/40 hover:text-white hover:bg-white/5'
                            }`}
                            title={link.label}
                        >
                            <link.icon size={16} />
                        </Link>
                    );
                })}
            </nav>
            <Link
                href="/auth"
                className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-950/20 transition-all"
                title="Sign In"
            >
                <LogOut size={16} className="rotate-180" />
            </Link>
        </>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:flex-col sticky top-0 self-start w-16 bg-[#05081A]/95 border-r border-[#4FC3F7]/10 max-h-screen items-center py-4 z-30">
                {sidebarContent}
            </aside>

            {/* Mobile floating button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed bottom-5 right-5 w-12 h-12 rounded-full bg-[#4FC3F7] text-[#0A0F2C] flex items-center justify-center shadow-lg shadow-[#4FC3F7]/30 z-50 hover:scale-105 transition-transform"
                aria-label="Open navigation menu"
            >
                <Menu size={20} />
            </button>

            {/* Mobile slide-in overlay */}
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
                            className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#05081A]/98 border-r border-[#4FC3F7]/20 z-50 flex flex-col items-center py-6"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#E8E0D5]/60 hover:text-white hover:bg-white/5 transition-all"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                            <div className="mt-8">
                                {sidebarContent}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
