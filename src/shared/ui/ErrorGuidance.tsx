'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { ROUTES } from '@/config/routes';
import { SUPPORT_EMAIL } from '@/shared/constants';
import type { ReactNode, ElementType } from 'react';

// ─── ErrorGuidance (role-aware link inside banners) ──────────────────────

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
    const { t } = useLanguage();
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
                    aria-label={t('common.errorLogsDashboard')}
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


// ─── ErrorBanner (shared animated banner component) ───────────────────────

type BannerTone = 'red' | 'yellow' | 'green';

interface ErrorBannerProps {
    /** Visual tone: 'red' for validation/auth errors, 'yellow' for degraded state, 'green' for success */
    tone: BannerTone;
    /** lucide-react icon component (e.g. AlertCircle, AlertTriangle, CheckCircle) */
    icon: ElementType;
    /** Primary message shown in the banner */
    message: string | ReactNode;
    /** Whether to show the ErrorGuidance link/mailto below the message (default: true) */
    showGuidance?: boolean;
    /** Extra className overrides (allows consumers to tweak margin, font-size, etc.) */
    className?: string;
    /** Optional children rendered after the guidance line */
    children?: ReactNode;
}

const TONE_CLASSES: Record<BannerTone, {
    container: string;
    icon: string;
}> = {
    red: {
        container: 'bg-red-950/40 border border-red-500/30 text-red-200',
        icon: 'text-red-400',
    },
    yellow: {
        container: 'bg-yellow-950/30 border border-yellow-500/35 text-yellow-100',
        icon: 'text-yellow-400',
    },
    green: {
        container: 'bg-green-950/40 border border-green-500/30 text-green-200',
        icon: 'text-green-400',
    },
};

/**
 * Shared animated banner with tone-aware styling, icon, message, ErrorGuidance, and optional children.
 * Replaces the duplicated motion.div + flex + ErrorGuidance pattern across auth/checkout/dashboard.
 *
 * Usage example:
 * ```tsx
 * <ErrorBanner tone="red" icon={AlertCircle} message={error} />
 * <ErrorBanner tone="green" icon={CheckCircle} message="Saved!" showGuidance={false} />
 * <ErrorBanner tone="yellow" icon={AlertTriangle} message={`Degraded: ${dataError}`} />
 * ```
 */
export function ErrorBanner({
    tone,
    icon: Icon,
    message,
    showGuidance = true,
    className = 'mb-5',
    children,
}: ErrorBannerProps) {
    const tones = TONE_CLASSES[tone];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3.5 rounded-xl text-xs ${tones.container} ${className}`}
            role="alert"
        >
            <div className="flex items-start gap-2">
                <Icon size={14} className={`shrink-0 mt-0.5 ${tones.icon}`} />
                <span>{message}</span>
            </div>
            {showGuidance && <ErrorGuidance className="text-[9px]" />}
            {children}
        </motion.div>
    );
}