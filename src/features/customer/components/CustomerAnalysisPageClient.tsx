'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCustomerAnalysis } from '../hooks/useCustomerAnalysis';
import { usePersonalActivity } from '../hooks/usePersonalActivity';
import { useRewards } from '../hooks/useRewards';
import CustomerAnalysisView from './CustomerAnalysisView';

/**
 * Client wrapper for /dashboard/analysis.
 * Pulls the logged-in user, then streams personal analysis data, the
 * real-time per-user personal activity feed (orders, saved designs), and
 * the real-time loyalty rewards + leaderboard.
 */
export default function CustomerAnalysisPageClient() {
    const { user } = useAuth();
    const memberName = user?.fullName?.split(' ')[0] || 'Member';
    const { data, loading, error } = useCustomerAnalysis(user?.id ?? null);
    const { events, loading: activityLoading, wsLive, error: activityError } = usePersonalActivity(user?.id ?? null);
    const { data: rewards, loading: rewardsLoading, error: rewardsError, wsLive: rewardsLive } = useRewards(user?.id ?? null);

    return (
        <CustomerAnalysisView
            data={data}
            loading={loading}
            error={error}
            memberName={memberName}
            personalEvents={events}
            isPersonalLive={wsLive}
            personalActivityError={activityError}
            personalActivityLoading={activityLoading}
            rewardsData={rewards}
            rewardsLoading={rewardsLoading}
            rewardsError={rewardsError}
            isRewardsLive={rewardsLive}
        />
    );
}
