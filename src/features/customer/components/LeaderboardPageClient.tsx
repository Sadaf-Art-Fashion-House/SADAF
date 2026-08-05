'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import LeaderboardView from './LeaderboardView';
import type { LeaderboardKind } from '../types';

interface LeaderboardPageClientProps {
    /** Ranking kinds to offer in the switcher (default: points only). */
    kinds?: LeaderboardKind[];
    /** Kind selected on first render (default: points). */
    initialKind?: LeaderboardKind;
}

/**
 * Client wrapper for the leaderboard routes. Pulls the logged-in user, then
 * streams the full top-100 leaderboard (search + tier filtering happen inside
 * LeaderboardView). Used by the customer page (/dashboard/leaderboard), the
 * admin variant, and the founder variant — pass `kinds` to show the
 * Points / Sales / Designs switcher on the admin & founder pages.
 *
 * Live updates arrive over the `leaderboard:global` WebSocket channel when
 * someone shops; REST polling is the fallback (see useLeaderboard).
 */
export default function LeaderboardPageClient({
    kinds,
    initialKind = 'points',
}: LeaderboardPageClientProps) {
    const { user } = useAuth();
    const memberName = user?.fullName?.split(' ')[0] || 'Member';

    const [activeKind, setActiveKind] = useState<LeaderboardKind>(initialKind);
    const { data, loading, error, wsLive } = useLeaderboard(user?.id ?? null, 100, activeKind);

    // User is not logged in — show sign-in prompt
    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to view the leaderboard.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <LeaderboardView
            entries={data?.entries ?? []}
            myRank={data?.myRank ?? 1}
            totalMembers={data?.totalMembers ?? 0}
            loading={loading}
            error={error}
            memberName={memberName}
            kind={activeKind}
            kinds={kinds}
            activeKind={activeKind}
            onKindChange={setActiveKind}
            isLive={wsLive}
        />
    );
}
