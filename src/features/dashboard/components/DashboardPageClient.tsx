'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import SignedInToast from '@/shared/components/SignedInToast';
import DashboardView from './DashboardView';
import type { CustomerSpendingPoint } from '@/features/customer/types';

export default function DashboardPageClient() {
    const router = useRouter();
    const { user, logout, updateProfile } = useAuth();
    const { t } = useLanguage();

    // Monthly performance data for the dashboard-home chart (12-month
    // spending series from the customer-analysis API — same source of truth
    // as the Analysis page).
    const [monthlyPerformance, setMonthlyPerformance] = useState<CustomerSpendingPoint[] | null>(null);
    const [monthlyLoading, setMonthlyLoading] = useState(true);
    const [monthlyError, setMonthlyError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setMonthlyLoading(false);
            return;
        }
        const controller = new AbortController();
        const query = user.id ? `?userId=${encodeURIComponent(user.id)}` : '';
        fetch(`/api/dashboard/customer-analysis${query}`, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json: { monthlySpending?: CustomerSpendingPoint[] }) => {
                setMonthlyPerformance(json.monthlySpending ?? []);
                setMonthlyError(null);
            })
            .catch((err: unknown) => {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                setMonthlyError(err instanceof Error ? err.message : 'Failed to load monthly performance');
            })
            .finally(() => setMonthlyLoading(false));
        return () => controller.abort();
    }, [user]);

    const handleLogout = () => {
        logout();
        router.push('/auth');
    };

    // Hooks rules: all hooks before any early return.

    if (!user) {
        // We use a timeout to avoid the "Cannot update during render" error
        // that would happen if we called router.push() directly in render.
        // Using useEffect or relying on the auth state change is cleaner.
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('dashboardHome.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
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
            <DashboardView
                user={user}
                onLogout={handleLogout}
                onUpdateProfile={updateProfile}
                monthlyPerformance={monthlyPerformance}
                monthlyPerformanceLoading={monthlyLoading}
                monthlyPerformanceError={monthlyError}
            />
        </>
    );
}
