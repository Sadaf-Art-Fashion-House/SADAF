import type { Metadata } from 'next';
import CommunityPageClient from '@/features/community/components/CommunityPageClient';

export const metadata: Metadata = {
    title: 'My Network | SADAF Atelier',
    description: 'Manage your family, friends, and network connections in the SADAF community.',
};

export default function CommunityPage() {
    return <CommunityPageClient />;
}
