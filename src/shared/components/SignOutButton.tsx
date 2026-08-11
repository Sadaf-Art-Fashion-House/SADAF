'use client';

/**
 * SADAF | Shared — Sign Out Button + User Chip Menu (sidebar footer)
 *
 * Two-part footer control shared by every role sidebar:
 *
 * 1. **User chip** — avatar + full name + role badge. Clicking it opens a
 *    quick menu: Profile, Commissions (designer / sales partner only — those
 *    are the only roles with a commissions page), and Sign Out.
 * 2. **Sign Out button** — the primary sign-out control below the chip.
 *
 * Signing out clears the sandbox session + role cookie via useAuth.logout and
 * navigates to /auth?signedOut=1 (the flag makes the auth page show a green
 * confirmation toast). The middleware lets guests through /auth.
 *
 * Two variants match the sidebar layouts: `rail` (desktop icon rail that
 * reveals labels on hover) and `mobile` (full-width row in the drawer).
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Wallet, BarChart3, Bell } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_BADGES } from '@/features/auth/types';
import { useUnreadCountStore } from '@/features/notifications/store/useUnreadCountStore';
import { isCustomerRole } from '@/shared/types';
import { ROUTES } from '@/config/routes';

interface SignOutButtonProps {
    /** Desktop rail (icon-only until hover) vs mobile drawer full-width row. */
    variant?: 'rail' | 'mobile';
    /** Called right after signing out — e.g. closes the mobile drawer. */
    onSignedOut?: () => void;
}

export default function SignOutButton({ variant = 'rail', onSignedOut }: SignOutButtonProps) {
    const { logout, user } = useAuth();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Live unread-notification count — published by the header bell's
    // WebSocket hook (single connection, shared store). Shown as a badge
    // next to the menu's Sign Out item.
    const unreadCount = useUnreadCountStore((state) => state.unreadCount);

    const hasCommissions = user?.role === 'designer' || user?.role === 'sales_partner';
    const isCustomer = isCustomerRole(user?.role ?? 'customer_individual');

    // Close the quick menu on outside click or Escape.
    useEffect(() => {
        if (!menuOpen) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);

    const handleSignOut = () => {
        setMenuOpen(false);
        logout();
        onSignedOut?.();
        // logout() clears the role cookie → the middleware lets /auth through
        // for guests, so we land on the sign-in page. The ?signedOut=1 flag
        // makes the auth page show a green confirmation toast (My Activity
        // style) on arrival.
        router.push(`${ROUTES.AUTH}?signedOut=1`);
    };

    /** Avatar circle — uploaded picture when present, initial as fallback. */
    const avatar = user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- base64 data URLs
        <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="w-full h-full object-cover"
        />
    ) : (
        <span className="text-[10px] font-serif text-white">
            {(user?.fullName || '?').charAt(0).toUpperCase()}
        </span>
    );

    const avatarCircle = (
        <span className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#C9A84C] to-[#4FC3F7] flex items-center justify-center shrink-0">
            {avatar}
        </span>
    );

    /** Where "Profile" leads: the customer profile page, or the role's
     * dashboard home for roles that don't have a dedicated profile route. */
    const profileHref = isCustomer ? ROUTES.DASHBOARD_PROFILE : ROUTES.DASHBOARD;

    /** The quick-menu items — rendered inside a positioned container by each variant. */
    const menuItems = (): ReactNode => (
        <>
            <Link
                href={profileHref}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
                <User size={12} className="text-[#4FC3F7]" />
                Profile
            </Link>
            {isCustomer && (
                <Link
                    href={ROUTES.DASHBOARD_ANALYSIS}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                    <BarChart3 size={12} className="text-[#4FC3F7]" />
                    My Analysis
                </Link>
            )}
            {isCustomer && (
                <Link
                    href={ROUTES.DASHBOARD_NOTIFICATIONS}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                    <Bell size={12} className="text-[#C9A84C]" />
                    Notifications
                </Link>
            )}
            {hasCommissions && (
                <Link
                    href={
                        user?.role === 'sales_partner'
                            ? ROUTES.DASHBOARD_SALES_PARTNER_COMMISSIONS
                            : ROUTES.DASHBOARD_DESIGNER_COMMISSIONS
                    }
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#E8E0D5]/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                    <Wallet size={12} className="text-[#C9A84C]" />
                    Commissions
                </Link>
            )}
            <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-red-400/70 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
            >
                <LogOut size={12} className="rotate-180" />
                Sign Out
                {unreadCount > 0 && (
                    <span className="ml-auto shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-red-400 text-[#0A0F2C] text-[8px] font-mono font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </>
    );

    if (variant === 'mobile') {
        return (
            <div className="w-full mt-4">
                {user && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 mb-1 hover:border-[#C9A84C]/30 transition-all cursor-pointer w-full text-left"
                            title={`${user.fullName} — ${ROLE_BADGES[user.role] ?? user.role} (menu)`}
                        >
                            {avatarCircle}
                            <span className="min-w-0 flex-1">
                                <span className="block text-[11px] font-semibold text-[#E8E0D5] truncate">
                                    {user.fullName}
                                </span>
                                <span className="block text-[8px] font-mono uppercase tracking-wider text-[#C9A84C]/70 truncate">
                                    {ROLE_BADGES[user.role] ?? user.role}
                                </span>
                                <span className="block text-[8px] text-[#E8E0D5]/40 truncate">
                                    {user.email}
                                </span>
                            </span>
                            <span
                                className={`text-[#E8E0D5]/30 transition-transform duration-200 shrink-0 ${menuOpen ? 'rotate-180' : ''}`}
                            >
                                ▾
                            </span>
                        </button>

                        {menuOpen && (
                            <div
                                ref={menuRef}
                                role="menu"
                                className="w-full bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1 mb-1"
                            >
                                {menuItems()}
                            </div>
                        )}
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                >
                    <LogOut size={16} className="shrink-0 rotate-180" />
                    <span className="text-[10px] font-mono uppercase tracking-wider">Sign Out</span>
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            {user && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="flex items-center gap-3 py-2 w-full hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer"
                        title={`${user.fullName} — ${ROLE_BADGES[user.role] ?? user.role} (menu)`}
                    >
                        <span className="w-16 flex justify-center shrink-0">
                            {avatarCircle}
                        </span>
                        <span className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-left">
                            <span className="block text-[10px] font-semibold text-[#E8E0D5]/70 truncate">
                                {user.fullName}
                            </span>
                            <span className="block text-[8px] font-mono uppercase tracking-wider text-[#C9A84C]/60 truncate">
                                {ROLE_BADGES[user.role] ?? user.role}
                            </span>
                            <span className="block text-[8px] text-[#E8E0D5]/40 truncate">
                                {user.email}
                            </span>
                        </span>
                    </button>

                    {/* Rail menu opens to the right of the collapsed icon column. */}
                    {menuOpen && (
                        <div
                            ref={menuRef}
                            role="menu"
                            className="absolute left-16 top-0 z-50 w-44 bg-[#0A0F2C]/98 border border-[#C9A84C]/20 rounded-xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden py-1"
                        >
                            {menuItems()}
                        </div>
                    )}
                </div>
            )}
            <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 py-2 w-full text-red-400/50 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200 cursor-pointer"
                title="Sign Out"
            >
                <span className="w-16 flex justify-center shrink-0">
                    <LogOut size={16} className="rotate-180" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Sign Out
                </span>
            </button>
        </div>
    );
}
