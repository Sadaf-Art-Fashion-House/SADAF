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
import { useDesignerData } from '../hooks/useDesignerData';
import DesignerDashboardView from './DesignerDashboardView';
import type { NewDesignSubmission } from '../types';

export default function DesignerDashboardPageClient() {
    const { user } = useAuth();
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
                        You need to sign in to access the designer dashboard.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#A78BFA] to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <DesignerDashboardView
            data={data}
            loading={loading}
            error={error}
            wsLive={wsLive}
            submitting={submitting}
            onSubmit={handleSubmit}
            onRetry={refetch}
        />
    );
}
