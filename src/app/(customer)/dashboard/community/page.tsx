import type { Metadata } from 'next';
import { Suspense } from 'react';
import CommunityPageClient from '@/features/community/components/CommunityPageClient';

export const metadata: Metadata = {
    title: 'My Network | SADAF Atelier',
    description: 'Manage your family, friends, and network connections in the SADAF community.',
};

export default function CommunityPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center" />}>
            <CommunityPageClient />
        </Suspense>
    );
}
