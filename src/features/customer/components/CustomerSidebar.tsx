'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, User } from 'lucide-react';

export default function CustomerSidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/profile', label: 'Profile', icon: User },
    ];

    return (
        <aside className="hidden md:flex md:flex-col fixed left-0 top-20 w-16 bg-[#0A0F2C]/95 border-r border-[#C9A84C]/10 h-[calc(100vh-5rem)] items-center py-4 z-30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center text-[10px] font-bold text-[#0A0F2C] mb-6">
                G
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
                                    ? 'bg-amber-500/10 text-[#C9A84C]'
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
    );
}
