import type { Metadata } from 'next';
import CommunityOverviewPageClient from '@/features/admin/components/CommunityOverviewPageClient';

export const metadata: Metadata = {
    title: 'Community Overview | SADAF Founder',
    description: 'Platform-wide referral network: KPIs, top referrers, growth, and pending connection requests.',
};

interface FounderCommunityPageProps {
    /** Deep-link: ?referrer=<id> opens that referrer's network snapshot. */
    searchParams: Promise<{ referrer?: string }>;
}

/**
 * Founder community overview — the back-office view of the referral
 * community. Server component that only renders the client wrapper
 * (3-layer pattern: page → PageClient → View).
 */
export default async function FounderCommunityPage({ searchParams }: FounderCommunityPageProps) {
    const { referrer } = await searchParams;
    return <CommunityOverviewPageClient initialReferrer={referrer} />;
}
