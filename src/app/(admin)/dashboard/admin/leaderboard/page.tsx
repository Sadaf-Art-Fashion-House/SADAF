import type { Metadata } from 'next';
import LeaderboardPageClient from '@/features/customer/components/LeaderboardPageClient';
import type { LeaderboardKind } from '@/features/customer/types';

export const metadata: Metadata = {
    title: 'Leaderboard | SADAF Admin',
    description: 'Top members, sales partners, and designers — ranked by loyalty points, sales volume, and designs published.',
};

/**
 * Admin leaderboard — reuses the shared LeaderboardView with the kind
 * switcher (Points / Sales / Designs) so admins can rank customers, sales
 * partners, and designers from one page.
 */
interface AdminLeaderboardPageProps {
    searchParams: Promise<{ city?: string }>;
}

export default async function AdminLeaderboardPage({ searchParams }: AdminLeaderboardPageProps) {
    const { city } = await searchParams;
    const kinds: LeaderboardKind[] = ['points', 'sales', 'designs'];
    return <LeaderboardPageClient kinds={kinds} initialKind="points" initialCity={city ?? 'All'} />;
}
