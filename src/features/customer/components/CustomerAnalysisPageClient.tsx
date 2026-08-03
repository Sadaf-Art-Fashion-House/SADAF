'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCustomerAnalysis } from '../hooks/useCustomerAnalysis';
import CustomerAnalysisView from './CustomerAnalysisView';

/**
 * Client wrapper for /dashboard/analysis.
 * Pulls the logged-in user, then streams personal analysis data.
 */
export default function CustomerAnalysisPageClient() {
    const { user } = useAuth();
    const { data, loading, error } = useCustomerAnalysis(user?.id ?? null);

    return (
        <CustomerAnalysisView
            data={data}
            loading={loading}
            error={error}
            memberName={user?.fullName?.split(' ')[0] || 'Member'}
        />
    );
}
