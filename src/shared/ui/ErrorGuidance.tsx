'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { SUPPORT_EMAIL } from '@/shared/constants';

/**
 * Role-aware guidance line shown under user-facing error banners anywhere in
 * the app (auth, checkout, dashboards, exports…).
 *
 * - Admin / Founder → a real link straight to their Error Logs page, so the
 *   user can jump from "this failed" to reviewing the logged error.
 * - Everyone else (customers, guests, designers…) → a "contact support" hint
 *   with the support email, because regular users can't access the internal
 *   Error Logs dashboard.
 *
 * Styling follows the banner conventions (tiny muted mono text); pass a
 * `className` to override the font size per banner (e.g. `text-[9px]`).
 */
export function ErrorGuidance({ className = '' }: { className?: string }) {
    const { user } = useAuth();
    const role = user?.role;

    const isFounder = role === 'founder';
    const isAdmin = role?.startsWith('admin') ?? false;

    if (isFounder || isAdmin) {
        const href = isFounder
            ? ROUTES.DASHBOARD_FOUNDER_ERROR_LOGS
            : ROUTES.DASHBOARD_ERROR_LOGS;
        return (
            <span className={`block font-mono leading-relaxed mt-1 text-[#E8E0D5]/40 ${className}`}>
                If this keeps happening, check the{' '}
                <Link
                    href={href}
                    className="text-[#C9A84C]/80 hover:text-[#C9A84C] hover:underline transition-colors"
                    aria-label="Open the Error Logs dashboard"
                >
                    Error Logs
                </Link>
                .
            </span>
        );
    }

    return (
        <span className={`block font-mono leading-relaxed mt-1 text-[#E8E0D5]/40 ${className}`}>
            If this keeps happening, contact support at{' '}
            <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[#C9A84C]/80 hover:text-[#C9A84C] hover:underline transition-colors"
                aria-label={`Email support at ${SUPPORT_EMAIL}`}
            >
                {SUPPORT_EMAIL}
            </a>
            .
        </span>
    );
}
