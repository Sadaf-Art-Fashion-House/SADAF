'use client';

/**
 * SADAF | Designer — Dashboard Page Client
 *
 * Auth gate (designer only — enforced server-side by middleware too) plus
 * the data hook and the submit handler. All real logic lives here; the
 * view stays purely presentational.
 */

import { useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import SignedInToast from '@/shared/components/SignedInToast';
import { useDesignerData } from '../hooks/useDesignerData';
import DesignerDashboardView from './DesignerDashboardView';
import type { NewDesignSubmission } from '../types';

export default function DesignerDashboardPageClient() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { data, loading, error, wsLive, refetch, submitDesign, submitting } = useDesignerData();

    // Hooks rules: all hooks called unconditionally, BEFORE any early return. ✅
    const handleSubmit = useCallback(
        (input: NewDesignSubmission) => submitDesign(input),
        [submitDesign],
    );

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('designer.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#A78BFA] to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
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
            <DesignerDashboardView
                data={data}
                loading={loading}
                error={error}
                wsLive={wsLive}
                submitting={submitting}
                onSubmit={handleSubmit}
                onRetry={refetch}
            />
        </>
    );
}
