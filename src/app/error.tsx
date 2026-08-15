'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Sparkles, ShoppingBag } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { logError } from '@/features/error-logging';
import { getEmailSettings, sendErrorReportByEmail } from '@/features/email-settings';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    const { t } = useLanguage();
    const [reportSent, setReportSent] = useState(false);

    useEffect(() => {
        // Log to browser console
        console.error('[Error Boundary]', error);

        // Auto-log to server API (falls back to localStorage if offline)
        logError(error).catch(() => {
            // Silently ignore — error logging should never crash the error page
        });

        // Auto-send email if configured
        const settings = getEmailSettings();
        if (settings.notifyOnError && settings.recipients.length > 0) {
            const entry = {
                message: error.message || 'Unknown error',
                stack: error.stack,
                url: typeof window !== 'undefined' ? window.location.href : '',
                timestamp: new Date().toISOString(),
                digest: error.digest,
            };

            sendErrorReportByEmail([entry], settings)
                .then(() => setReportSent(true))
                .catch(() => {
                    // Still mark as notified — the error was logged locally
                    setReportSent(true);
                });
        } else {
            // Even without email config, the error was logged to localStorage
            // So the admin will see it in the Error Logs dashboard
            setReportSent(true);
        }
    }, [error]);

    return (
        <ErrorFallback
            error={error}
            onReset={reset}
            subtitle={t('error.pageSubtitle')}
            title={t('error.loomTitle')}
            description={t('error.pageDescription')}
            reportSent={reportSent}
            size="screen"
            showLogo
            actions={
                <Link
                    href={ROUTES.HOME}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#C9A84C]/30 bg-transparent hover:bg-[#C9A84C]/10 text-[#C9A84C] hover:text-white hover:border-[#C9A84C]/60 active:scale-95 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
                >
                    <Home size={13} /> Home
                </Link>
            }
            footer={
                <span className="text-[8px] text-[#E8E0D5]/25 font-mono tracking-[0.3em] uppercase">
                    &copy; 2026 SADAF ART FASHION HOUSE
                </span>
            }
        >
            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Link
                    href={ROUTES.AI_STUDIO}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E8E0D5]/10 bg-transparent hover:bg-white/5 text-[#E8E0D5]/50 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                    <Sparkles size={11} /> AI Studio
                </Link>

                <Link
                    href={ROUTES.STORE}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E8E0D5]/10 bg-transparent hover:bg-white/5 text-[#E8E0D5]/50 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                    <ShoppingBag size={11} /> Store
                </Link>
            </div>
        </ErrorFallback>
    );
}
