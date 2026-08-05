import type { Metadata } from 'next';
import LeaderboardPageClient from '@/features/customer/components/LeaderboardPageClient';

export const metadata: Metadata = {
    title: 'Leaderboard | SADAF Atelier',
    description: 'Top members ranked by loyalty points — search and filter by membership tier.',
};

export default function LeaderboardPage() {
    return <LeaderboardPageClient />;
}
