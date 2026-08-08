import type { Metadata } from 'next';
import CommunityOverviewPageClient from '@/features/admin/components/CommunityOverviewPageClient';

export const metadata: Metadata = {
    title: 'Community Overview | SADAF Admin',
    description: 'Platform-wide referral network: KPIs, top referrers, growth, and pending connection requests.',
};

interface AdminCommunityPageProps {
    /** Deep-link: ?referrer=<id> opens that referrer's network snapshot. */
    searchParams: Promise<{ referrer?: string }>;
}

/**
 * Admin community overview — the back-office view of the referral
 * community. Server component that only renders the client wrapper
 * (3-layer pattern: page → PageClient → View).
 */
export default async function AdminCommunityPage({ searchParams }: AdminCommunityPageProps) {
    const { referrer } = await searchParams;
    return <CommunityOverviewPageClient initialReferrer={referrer} />;
}
