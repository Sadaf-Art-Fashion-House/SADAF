import type { Metadata } from 'next';
import LeaderboardPageClient from '@/features/customer/components/LeaderboardPageClient';

export const metadata: Metadata = {
    title: 'Leaderboard | SADAF Atelier',
    description: 'Top members ranked by loyalty points — search and filter by membership tier.',
};

interface LeaderboardPageProps {
    searchParams: Promise<{ city?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
    const { city } = await searchParams;
    return <LeaderboardPageClient initialCity={city ?? 'All'} />;
}
