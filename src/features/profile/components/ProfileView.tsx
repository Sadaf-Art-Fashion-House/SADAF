'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
    User,
    Mail,
    MapPin,
    Calendar,
    Camera,
    CheckCircle,
    LogOut,
    ShoppingBag,
    Heart,
    Sparkles,
    LayoutDashboard,
    Shield,
    Compass,
    Edit3,
    PenLine,
    Copy,
    X,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { isCustomerRole, isAdminRole } from '@/shared/types';
import { ROLE_BADGES, ROLE_BADGE_COLORS } from '@/features/auth/types';
import { ROUTES } from '@/config/routes';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore';
import { useOrdersStore } from '@/features/orders/store/useOrdersStore';
import { fileToResizedDataUrl } from '@/shared/utils/fileToResizedDataUrl';

interface ProfileViewProps {
    user: UserProfile;
    onLogout: () => void;
    /** Persist a profile change (avatar, name) — updates context + storage. */
    onUpdateProfile: (patch: Partial<UserProfile>) => void;
}

export default function ProfileView({ user, onLogout, onUpdateProfile }: ProfileViewProps) {
    const { t, language } = useLanguage();

    // ── Profile state ──
    const [fullName, setFullName] = useState(user.fullName || '');
    const [bio, setBio] = useState(t('profile.defaultBio'));
    const [shippingAddress, setShippingAddress] = useState(t('profile.defaultAddress'));
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Wishlist count ──
    const wishlistCount = useWishlistStore((state) => state.items.length);
    const ordersCount = useOrdersStore((state) => state.totalCount);

    const badgeText = ROLE_BADGES[user.role] || user.role;
    const badgeColor = ROLE_BADGE_COLORS[user.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

    // ── Handlers ──
    const handleAvatarUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const dataUrl = await fileToResizedDataUrl(file);
                onUpdateProfile({ avatarUrl: dataUrl });
                setSuccessMsg(t('profile.msg.avatarUpdated'));
                setTimeout(() => setSuccessMsg(null), 2500);
            } catch (err: unknown) {
                setSuccessMsg(err instanceof Error ? err.message : t('profile.msg.avatarFailed'));
                setTimeout(() => setSuccessMsg(null), 3500);
            } finally {
                // Allow re-selecting the same file after a failed/again pick.
                e.target.value = '';
            }
        },
        [onUpdateProfile, t],
    );

    const handleRemoveAvatar = useCallback(() => {
        onUpdateProfile({ avatarUrl: undefined });
        setSuccessMsg(t('profile.msg.avatarRemoved'));
        setTimeout(() => setSuccessMsg(null), 2500);
    }, [onUpdateProfile, t]);

    const handleUpdateProfile = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({ fullName: fullName.trim() });
        setSuccessMsg(t('profile.msg.profileUpdated'));
        setTimeout(() => setSuccessMsg(null), 3000);
    }, [fullName, onUpdateProfile, t]);

    const handleCopyReferral = useCallback(() => {
        if (user.referralCode) {
            navigator.clipboard.writeText(user.referralCode)
                .then(() => {
                    setSuccessMsg(t('profile.msg.referralCopied'));
                    setTimeout(() => setSuccessMsg(null), 2000);
                })
                .catch(() => {
                    setSuccessMsg(t('profile.msg.copyFailed'));
                    setTimeout(() => setSuccessMsg(null), 2000);
                });
        }
    }, [user.referralCode, t]);

    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Background glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <section className="relative pt-20 pb-8 px-4 md:px-8 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row items-center md:items-start gap-6"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#C9A84C] to-[#4FC3F7] flex items-center justify-center text-3xl font-serif text-white shadow-lg shadow-[#C9A84C]/20 cursor-pointer group relative"
                                title={t('profile.uploadTitle')}
                            >
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    fullName.charAt(0).toUpperCase()
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                                    <Camera size={18} className="text-white" />
                                </div>
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            {user.avatarUrl && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 flex items-center justify-center hover:bg-red-500/25 transition-all cursor-pointer"
                                    title={t('profile.removeAvatar')}
                                    aria-label={t('profile.removeAvatar')}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                                <h1 className="text-2xl md:text-3xl font-serif text-white">{fullName}</h1>
                                <span className={`px-3 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border font-semibold w-fit ${badgeColor}`}>
                                    {badgeText}
                                </span>
                            </div>
                            <p className="text-sm text-[#E8E0D5]/60 mb-1 flex items-center justify-center md:justify-start gap-1.5">
                                <Mail size={12} className="shrink-0" /> {user.email}
                            </p>

                            {user.referralCode && (
                                <button onClick={handleCopyReferral}
                                    className="flex items-center gap-1.5 text-[10px] font-mono text-[#4FC3F7] hover:text-[#C9A84C] transition-colors cursor-pointer mb-3"
                                    title={t('profile.copyReferralTitle')}
                                >
                                    <Shield size={11} /> {t('profile.referralLabel')} <strong>{user.referralCode}</strong>
                                    <Copy size={10} className="opacity-60" />
                                </button>
                            )}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                <Link href={ROUTES.DASHBOARD}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all duration-300 flex items-center gap-1.5"
                                >
                                    <LayoutDashboard size={11} /> {t('profile.dashboardHome')}
                                </Link>
                                {user.hasDesignerAccess && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border border-violet-500/30 text-violet-400 bg-violet-500/10 font-semibold">
                                        {t('profile.designerAccess')}
                                    </span>
                                )}
                                <button onClick={onLogout}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-950/30 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <LogOut size={11} /> {t('common.signOut')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Success message toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-green-950/80 border border-green-500/30 text-green-200 text-xs rounded-xl flex items-center gap-2 shadow-xl shadow-green-900/30 backdrop-blur-sm"
                    >
                        <CheckCircle size={14} className="text-green-400 shrink-0" />
                        <span>{successMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ──────────────────────── CONTENT AREA ──────────────────────── */}
            <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Quick Links */}
                        <div className="p-5 bg-[#05081A]/80 border border-[#C9A84C]/10 rounded-2xl">
                            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] mb-4 font-bold">{t('profile.quickLinks')}</h3>
                            <nav className="space-y-1">
                                {[
                                    { href: ROUTES.DASHBOARD, label: t('profile.dashboardHome'), icon: LayoutDashboard },
                                    { href: ROUTES.ORDERS, label: t('profile.orders'), icon: ShoppingBag },
                                    { href: ROUTES.WISHLIST, label: t('profile.wishlist'), icon: Heart },
                                    { href: ROUTES.STORE, label: t('orders.continueShopping'), icon: ShoppingBag },
                                    { href: ROUTES.CART, label: t('profile.viewCart'), icon: ShoppingBag },
                                    { href: ROUTES.AI_STUDIO, label: t('nav.aiStudio'), icon: Sparkles },
                                    ...(isAdminRole(user.role) ? [{ href: ROUTES.DASHBOARD_ADMIN, label: t('profile.adminPanel'), icon: Shield }] : []),
                                    ...(user.role === 'founder' ? [{ href: ROUTES.DASHBOARD_FOUNDER, label: t('profile.founderPanel'), icon: Shield }] : []),
                                ].map((link) => (
                                    <Link key={link.href} href={link.href}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                                    >
                                        <link.icon size={14} className="text-[#C9A84C] group-hover:text-[#4FC3F7] transition-colors shrink-0" />
                                        <span>{link.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Account Details */}
                        <div className="p-5 bg-[#05081A]/80 border border-[#C9A84C]/10 rounded-2xl">
                            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] mb-4 font-bold">{t('profile.accountDetails')}</h3>
                            <div className="space-y-3 text-xs text-[#E8E0D5]/70">
                                <div className="flex items-center gap-2.5">
                                    <Calendar size={12} className="text-[#C9A84C]/60 shrink-0" />
                                    <div>
                                        <span className="block text-[9px] font-mono uppercase text-[#E8E0D5]/40">{t('profile.memberSince')}</span>
                                        {new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Shield size={12} className="text-[#C9A84C]/60 shrink-0" />
                                    <div>
                                        <span className="block text-[9px] font-mono uppercase text-[#E8E0D5]/40">{t('profile.accountId')}</span>
                                        <span className="font-mono text-[10px] text-[#C9A84C]/80 break-all">{user.id}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Compass size={12} className="text-[#C9A84C]/60 shrink-0" />
                                    <div>
                                        <span className="block text-[9px] font-mono uppercase text-[#E8E0D5]/40">{t('profile.role')}</span>
                                        <span className="text-[#C9A84C]">{badgeText}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* My Network — only for customer roles */}
                        {isCustomerRole(user.role) && (
                            <div className="p-5 bg-[#05081A]/80 border border-[#C9A84C]/10 rounded-2xl">
                                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] mb-4 font-bold flex items-center gap-2">
                                    <User size={12} /> {t('profile.myNetwork')}
                                </h3>
                                {user.connections && user.connections.length > 0 ? (
                                    <div className="space-y-2">
                                        {user.connections.map((connId) => (
                                            <div key={connId} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0A0F2C]/40 border border-[#C9A84C]/10">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#C9A84C] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                                    {connId.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs text-[#E8E0D5]/80 font-medium truncate">{t('profile.connection')}</p>
                                                    <p className="text-[9px] text-[#E8E0D5]/40 font-mono truncate">{connId}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-[#E8E0D5]/60 mb-1">{t('profile.networkGrowing')}</p>
                                        <p className="text-[10px] text-[#E8E0D5]/40 mb-3">{t('profile.networkInviteHint')}</p>
                                        <Link
                                            href={`${ROUTES.DASHBOARD_COMMUNITY}?invite=1`}
                                            className="inline-block px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                                        >
                                            {t('profile.inviteConnections')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Main panel — Profile Settings */}
                    <div className="lg:col-span-8">
                        <div className="bg-[#05081A]/90 border border-white/5 rounded-3xl p-6 md:p-8">
                            <div className="space-y-6">                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]"><Edit3 size={16} /></div>
                                        <div>
                                            <h2 className="text-lg font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">{t('profile.profileSettings')}</h2>
                                            <p className="text-[11px] text-slate-400">{t('profile.profileSettingsHint')}</p>
                                        </div>
                                    </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                                <PenLine size={11} /> {t('profile.fullName')}
                                            </label>
                                            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition placeholder-slate-600"
                                                placeholder={t('profile.fullNamePlaceholder')} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                                <Mail size={11} /> {t('profile.email')}
                                            </label>
                                            <input type="email" disabled value={user.email}
                                                className="w-full bg-black/10 border border-white/5 text-xs text-slate-500 rounded-xl p-3 outline-none cursor-not-allowed" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">{t('profile.personalBio')}</label>
                                        <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition resize-none placeholder-slate-600"
                                            placeholder={t('profile.bioPlaceholder')} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                            <MapPin size={11} /> {t('profile.shippingAddress')}
                                        </label>
                                        <input type="text" required value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition placeholder-slate-600"
                                            placeholder={t('profile.addressPlaceholder')} />
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-end">
                                        <button type="submit"
                                            className="px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                                        >
                                            <CheckCircle size={13} /> {t('profile.saveChanges')}
                                        </button>
                                    </div>
                                </form>

                                {/* ── Quick Stats Section ── */}
                                <div className="mt-12 pt-8 border-t-2 border-[#C9A84C]/20 relative">
                                    {/* Section decoration */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

                                    <h3 className="text-center text-[10px] font-mono uppercase tracking-[0.35em] text-[#C9A84C]/70 mb-8 font-bold">
                                        {t('profile.quickOverview')}
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {[
                                            { label: t('profile.orders'), value: String(ordersCount), icon: ShoppingBag, href: ROUTES.ORDERS, color: 'text-[#4FC3F7] bg-[#4FC3F7]/10' },
                                            { label: t('profile.wishlist'), value: String(wishlistCount), icon: Heart, href: ROUTES.WISHLIST, color: 'text-red-400 bg-red-500/10' },
                                            { label: t('profile.connections'), value: String(user.connections?.length || 0), icon: User, color: 'text-[#4FC3F7] bg-[#4FC3F7]/10' },
                                            { label: t('profile.memberSince'), value: new Date(user.createdAt).getFullYear().toString(), icon: Calendar, color: 'text-[#C9A84C] bg-[#C9A84C]/10' },
                                            { label: t('profile.role'), value: badgeText, icon: Shield, color: 'text-slate-400 bg-slate-500/10' },
                                        ].map((stat) => (
                                            stat.href ? (
                                                <Link key={stat.label} href={stat.href}
                                                    className="group relative flex flex-col items-center p-5 bg-[#0A0F2C]/60 border border-white/[0.05] hover:border-[#C9A84C]/30 rounded-2xl transition-all duration-500 hover:shadow-lg hover:shadow-[#C9A84C]/5 hover:-translate-y-0.5 cursor-pointer"
                                                >
                                                    {/* Icon container */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                                        <stat.icon size={18} />
                                                    </div>
                                                    <p className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight">{stat.value}</p>
                                                    <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#E8E0D5]/40 mt-1 font-semibold">
                                                        {stat.label}
                                                    </p>
                                                    {/* Hover indicator */}
                                                    <span className="absolute bottom-2 right-3 text-[7px] font-mono uppercase tracking-widest text-[#C9A84C]/0 group-hover:text-[#C9A84C]/50 transition-all duration-300">
                                                        {t('profile.viewHint')} →
                                                    </span>
                                                </Link>
                                            ) : (
                                                <div key={stat.label}
                                                    className="group relative flex flex-col items-center p-5 bg-[#0A0F2C]/60 border border-white/[0.05] rounded-2xl transition-all duration-300"
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                                        <stat.icon size={18} />
                                                    </div>
                                                    <p className="text-xl md:text-2xl font-serif text-white font-bold tracking-tight">{stat.value}</p>
                                                    <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#E8E0D5]/40 mt-1 font-semibold">
                                                        {stat.label}
                                                    </p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
