'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    User,
    LogOut,
    ShoppingBag,
    Heart,
    Sparkles,
    LayoutDashboard,
    Palette,
    Shirt,
    Store,
    Image as ImageIcon,
    Camera,
    Bot,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { isCustomerRole, isAdminRole, getRoleCategory } from '@/shared/types';
import { ROLE_BADGES, ROLE_BADGE_COLORS } from '@/features/auth/types';
import { ROUTES } from '@/config/routes';
import { fileToResizedDataUrl } from '@/shared/utils/fileToResizedDataUrl';

interface DashboardViewProps {
    user: UserProfile;
    onLogout: () => void;
    /** Persist a profile change (avatar) — updates context + storage. */
    onUpdateProfile: (patch: Partial<UserProfile>) => void;
}

const quickLinks = [
    { href: '/store', label: 'Continue Shopping', icon: Store },
    { href: '/artworks', label: 'Browse Artworks', icon: Palette },
    { href: '/fashion', label: 'Fashion Collection', icon: Shirt },
    { href: '/gallery', label: 'Virtual Gallery', icon: ImageIcon },
    { href: '/ai', label: 'AI Studio', icon: Bot },
];

/** Map a section title to the correct dashboard sub-route based on the user's role. */
function getSectionLink(title: string): string {
    if (title === 'Admin Panel') return '/dashboard/admin';
    if (title === 'Founder Controls') return '/dashboard/founder';
    // Customer/Designer modules -> the user profile dashboard
    if (title === 'My Orders' || title === 'Wishlist' || title === 'My Network' || title === 'My Collections') {
        return '/dashboard/profile';
    }
    if (title === 'Design Studio') return '/ai';
    if (title === 'Commission Dashboard' || title === 'Referral Network') return '/dashboard/profile';
    if (title === 'Bulk Orders') return '/dashboard/profile';
    return '/dashboard';
}

function getRoleSpecificSections(role: UserProfile['role']) {
    const cat = getRoleCategory(role);
    const sections = [];

    if (cat === 'customer' || cat === 'designer') {
        sections.push(
            { title: 'My Orders', desc: 'View your purchase history', icon: ShoppingBag },
            { title: 'Wishlist', desc: 'Saved items', icon: Heart },
            { title: 'My Network', desc: 'Family members & friends in SADAF', icon: User },
        );
    }
    if (cat === 'company') {
        sections.push(
            { title: 'My Collections', desc: 'Designs created via AI Studio', icon: Sparkles },
            { title: 'Bulk Orders', desc: 'Order history & production tracking', icon: ShoppingBag },
        );
    }
    if (cat === 'designer') {
        sections.push(
            { title: 'Design Studio', desc: 'Your AI-powered design tools', icon: Sparkles },
        );
    }
    if (cat === 'sales_partner') {
        sections.push(
            { title: 'Commission Dashboard', desc: 'Track your sales & earnings', icon: ShoppingBag },
            { title: 'Referral Network', desc: 'Customers you brought to SADAF', icon: User },
        );
    }
    if (isAdminRole(role)) {
        sections.push(
            { title: 'Admin Panel', desc: 'Platform administration tools', icon: LayoutDashboard },
        );
    }
    if (cat === 'founder') {
        sections.push(
            { title: 'Founder Controls', desc: 'Platform oversight & analytics', icon: Sparkles },
            { title: 'Admin Panel', desc: 'Manage inventory & orders', icon: LayoutDashboard },
        );
    }

    return sections;
}

export default function DashboardView({ user, onLogout, onUpdateProfile }: DashboardViewProps) {
    const availableSections = getRoleSpecificSections(user.role);
    const badgeText = ROLE_BADGES[user.role] || user.role;
    const badgeColor = ROLE_BADGE_COLORS[user.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const handleAvatarUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const dataUrl = await fileToResizedDataUrl(file);
                onUpdateProfile({ avatarUrl: dataUrl });
                setAvatarError(null);
            } catch (err: unknown) {
                setAvatarError(err instanceof Error ? err.message : 'Could not upload the image.');
            } finally {
                e.target.value = '';
            }
        },
        [onUpdateProfile],
    );

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-12 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row items-center md:items-start gap-6"
                    >
                        {/* Avatar — click to upload */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#C9A84C] to-[#4FC3F7] flex items-center justify-center text-2xl font-serif text-white shadow-lg shadow-[#C9A84C]/20 cursor-pointer group relative"
                                title="Upload profile picture"
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user.fullName.charAt(0).toUpperCase()
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <Camera size={16} className="text-white" />
                                </div>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                            {avatarError && (
                                <p className="mt-2 text-[9px] font-mono text-red-400">{avatarError}</p>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-serif text-white mb-1">
                                Welcome, {user.fullName}
                            </h1>
                            <p className="text-sm text-[#E8E0D5]/60 mb-3">{user.email}</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border font-semibold ${badgeColor}`}>
                                    {badgeText}
                                </span>

                                {user.hasDesignerAccess && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border border-violet-500/30 text-violet-400 bg-violet-500/10 font-semibold">
                                        + Designer Access
                                    </span>
                                )}

                                <Link
                                    href={isAdminRole(user.role) ? '/dashboard/admin' : user.role === 'founder' ? '/dashboard/founder' : '/dashboard/profile'}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all duration-300 flex items-center gap-1.5"
                                >
                                    <LayoutDashboard size={11} />
                                    Full Dashboard
                                </Link>

                                <button
                                    onClick={onLogout}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-950/30 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <LogOut size={11} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Quick Links */}
            <section className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
                <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-[#C9A84C] mb-5">
                    Quick Navigation
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex flex-col items-center gap-2 p-5 rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/10 hover:border-[#4FC3F7]/40 hover:bg-[#1B2A6B]/20 transition-all duration-300 group text-center"
                        >
                            <link.icon
                                size={20}
                                className="text-[#C9A84C] group-hover:text-[#4FC3F7] transition-colors"
                            />
                            <span className="text-xs text-[#E8E0D5]/80 group-hover:text-white transition-colors">
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Connections / Networking — for customers */}
            {isCustomerRole(user.role) && (
                <section className="py-6 px-4 md:px-8 max-w-5xl mx-auto">
                    <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-[#C9A84C] mb-5">
                        My Network
                    </h2>
                    <div className="rounded-xl bg-[#0A0F2C]/60 border border-[#C9A84C]/10 p-6">
                        {user.connections && user.connections.length > 0 ? (
                            <div className="space-y-3">
                                {user.connections.map((connId) => (
                                    <div key={connId} className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0F2C]/40 border border-[#C9A84C]/10">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#C9A84C] flex items-center justify-center text-[10px] font-bold text-white">
                                            {connId.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#E8E0D5]/80 font-medium">Connection #{connId}</p>
                                            <p className="text-[10px] text-[#E8E0D5]/40 font-mono">{connId}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <User size={24} className="mx-auto text-[#C9A84C]/40 mb-3" />
                                <p className="text-sm text-[#E8E0D5]/60 mb-1">Your network is growing</p>
                                <p className="text-[11px] text-[#E8E0D5]/40">
                                    Invite your family and friends to join SADAF and earn exclusive rewards.
                                </p>
                                <Link
                                    href={`${ROUTES.DASHBOARD_COMMUNITY}?invite=1`}
                                    className="mt-4 inline-block px-5 py-2 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                                >
                                    Invite Connections
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Role-based sections */}
            <section className="py-6 px-4 md:px-8 max-w-5xl mx-auto">
                <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-[#C9A84C] mb-5">
                    Dashboard Modules
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableSections.map((section) => (
                        <Link
                            key={section.title}
                            href={getSectionLink(section.title)}
                            className="block p-6 rounded-xl bg-[#0A0F2C]/60 border border-[#C9A84C]/10 hover:border-[#C9A84C]/30 transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <section.icon
                                    size={18}
                                    className="text-[#C9A84C] group-hover:text-[#4FC3F7] transition-colors"
                                />
                                <h3 className="text-sm font-serif text-white">{section.title}</h3>
                            </div>
                            <p className="text-[11px] text-[#E8E0D5]/50 leading-relaxed">
                                {section.desc}
                            </p>
                            <div className="mt-3 text-[9px] font-mono uppercase tracking-wider text-[#C9A84C]/60 group-hover:text-[#C9A84C] transition-colors">
                                Open Panel &rarr;
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Account info */}
            <section className="py-10 px-4 md:px-8 max-w-5xl mx-auto">
                <div className="rounded-xl bg-[#0A0F2C]/40 border border-[#C9A84C]/10 p-6">
                    <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-[#C9A84C] mb-4">
                        Account Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#E8E0D5]/70">
                        <div>
                            <span className="block text-[10px] font-mono uppercase text-[#E8E0D5]/40 mb-1">
                                Member Since
                            </span>
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                        <div>
                            <span className="block text-[10px] font-mono uppercase text-[#E8E0D5]/40 mb-1">
                                Account ID
                            </span>
                            <span className="font-mono text-[10px] text-[#C9A84C]/80">
                                {user.id}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
