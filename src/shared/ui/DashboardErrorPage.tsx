'use client';

/**
 * SADAF | Shared — Dashboard Route Error Page
 *
 * Used by the `error.tsx` of every dashboard route group (customer / admin /
 * founder / designer / sales-partner / company). Because the group layout
 * (site Header + role sidebar) renders OUTSIDE this boundary, a crash in any
 * dashboard page shows this contained fallback inside <main> while the
 * sidebar and header stay alive — the user can navigate away without a full
 * app reset.
 *
 * Errors are reported through the shared logging system so they appear in
 * the Admin/Founder Error Logs dashboards. `reset` is Next's built-in retry
 * (re-renders the failed segment).
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, LayoutDashboard } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { logError } from '@/features/error-logging';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface DashboardErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardErrorPage({ error, reset }: DashboardErrorPageProps) {
    const { t } = useLanguage();

    useEffect(() => {
        console.error('[Dashboard Error Boundary]', error);
        logError(error).catch(() => {
            // Logging must never crash the fallback page.
        });
    }, [error]);

    return (
        <ErrorFallback
            error={error}
            onReset={reset}
            subtitle={t('error.dashboardSubtitle')}
            title={t('error.loomTitle')}
            description={t('error.dashboardDescription')}
            size="section"
            actions={
                <>
                    <Link
                        href={ROUTES.DASHBOARD}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#C9A84C]/30 bg-transparent hover:bg-[#C9A84C]/10 text-[#C9A84C] hover:text-white hover:border-[#C9A84C]/60 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
                    >
                        <LayoutDashboard size={13} /> {t('common.dashboard')}
                    </Link>
                    <Link
                        href={ROUTES.HOME}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#E8E0D5]/10 bg-transparent hover:bg-white/5 text-[#E8E0D5]/50 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer"
                    >
                        <Home size={11} /> {t('common.home')}
                    </Link>
                </>
            }
        />
    );
}
