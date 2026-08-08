'use client';

import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCommunityOverview } from '../hooks/useCommunityOverview';
import CommunityOverviewView from './CommunityOverviewView';

interface CommunityOverviewPageClientProps {
    /** Deep-link: ?referrer=<id> opens that referrer's network snapshot. */
    initialReferrer?: string;
}

/**
 * Client wrapper for the admin & founder community overview pages
 * (/dashboard/admin/community, /dashboard/founder/community). Pulls the
 * logged-in user, then streams the platform community overview (KPIs, top
 * referrers, growth, pending requests) via useCommunityOverview.
 *
 * Same gate pattern as the other dashboard pages: guests see a sign-in
 * prompt; the route-group layouts own the admin/founder chrome.
 */
export default function CommunityOverviewPageClient({ initialReferrer }: CommunityOverviewPageClientProps) {
    const { user } = useAuth();
    const { data, loading, error, wsLive, refetch, resolveRequest, resolvingId } = useCommunityOverview();

    // User is not logged in — show sign-in prompt
    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to view the community overview.
                    </p>
                    <Link
                        href={ROUTES.AUTH}
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <CommunityOverviewView
            data={data}
            loading={loading}
            error={error}
            isLive={wsLive}
            onRefresh={refetch}
            onResolve={resolveRequest}
            resolvingId={resolvingId}
            initialReferrer={initialReferrer}
        />
    );
}
