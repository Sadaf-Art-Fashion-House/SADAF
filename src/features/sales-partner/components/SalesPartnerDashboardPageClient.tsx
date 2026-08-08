'use client';

/**
 * SADAF | Sales Partner — Dashboard Page Client
 *
 * Auth gate (sales_partner only — enforced server-side by middleware too)
 * plus the data hook. All real logic lives here; the view stays purely
 * presentational.
 */

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSalesPartnerData } from '../hooks/useSalesPartnerData';
import SalesPartnerDashboardView from './SalesPartnerDashboardView';

export default function SalesPartnerDashboardPageClient() {
    const { user } = useAuth();
    const { data, loading, error, wsLive, refetch } = useSalesPartnerData();

    // Hooks rules: all hooks called unconditionally, BEFORE any early return. ✅

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to access the sales partner dashboard.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-400 to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <SalesPartnerDashboardView
            data={data}
            loading={loading}
            error={error}
            wsLive={wsLive}
            onRetry={refetch}
        />
    );
}
