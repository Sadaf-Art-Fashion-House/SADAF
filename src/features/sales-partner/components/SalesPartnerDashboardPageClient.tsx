'use client';

/**
 * SADAF | Sales Partner — Dashboard Page Client
 *
 * Auth gate (sales_partner only — enforced server-side by middleware too)
 * plus the data hook. All real logic lives here; the view stays purely
 * presentational. Also hosts the real-time referral-converted toast: when a
 * pending lead converts to a paying order (detected by the hook from the WS
 * push / REST poll), the toast slides in with the order value and commission.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import SignedInToast from '@/shared/components/SignedInToast';
import { useSalesPartnerData } from '../hooks/useSalesPartnerData';
import type { ReferralRecord } from '../types';
import SalesPartnerDashboardView from './SalesPartnerDashboardView';
import ReferralConvertedToast from './ReferralConvertedToast';

/** How long the conversion toast stays before auto-dismissing. */
const TOAST_DURATION_MS = 8_000;

export default function SalesPartnerDashboardPageClient() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { data, loading, error, wsLive, refetch, latestConvertedReferral } = useSalesPartnerData();

    // Real-time conversion toast state — the hook fires latestConvertedReferral
    // on each pending → converted transition; we show it and auto-dismiss.
    const [activeToast, setActiveToast] = useState<ReferralRecord | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Hooks rules: all hooks called unconditionally, BEFORE any early return. ✅

    useEffect(() => {
        if (!latestConvertedReferral) return;
        setActiveToast(latestConvertedReferral);
        toastTimerRef.current = setTimeout(() => setActiveToast(null), TOAST_DURATION_MS);
        return () => clearTimeout(toastTimerRef.current ?? undefined);
    }, [latestConvertedReferral]);

    // Dismiss + clear the pending auto-dismiss timer (a late timer firing
    // could otherwise null a newer toast's state).
    const dismissToast = useCallback(() => {
        clearTimeout(toastTimerRef.current ?? undefined);
        setActiveToast(null);
    }, []);

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('sales.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-400 to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        {t('common.signIn')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Welcome-back confirmation toast after a successful login
                (reads ?signedIn=1 set by the auth page). */}
            <SignedInToast />
            <SalesPartnerDashboardView
                data={data}
                loading={loading}
                error={error}
                wsLive={wsLive}
                onRetry={refetch}
            />
            {/* Conversion toast — rendered globally so it floats above the page */}
            <ReferralConvertedToast referral={activeToast} onDismiss={dismissToast} />
        </>
    );
}
