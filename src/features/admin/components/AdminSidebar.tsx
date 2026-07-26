'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Cpu, Store, Shirt, LogOut, BarChart3, Shield } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const links = [
        { href: '/dashboard/admin', label: 'Admin', icon: Settings },
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/store', label: 'Store', icon: Store },
        { href: '/ai', label: 'AI Studio', icon: Cpu },
        { href: '/artworks', label: 'Artworks', icon: Shirt },
    ];

    return (
        <>
            <aside className="hidden md:flex md:flex-col fixed left-0 top-20 w-16 bg-[#05081A]/95 border-r border-[#4FC3F7]/10 h-[calc(100vh-5rem)] items-center py-4 z-30">
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
            </aside>
        </>
    );
}
