import type { Metadata } from 'next';
import ConnectionsPageClient from '@/features/connections/components/ConnectionsPageClient';

export const metadata: Metadata = {
    title: 'Brand Partnerships | SADAF Designer',
    description: 'Receive collaboration requests from brands and manage your active partnerships.',
};

export default function DesignerConnectionsPage() {
    return <ConnectionsPageClient role="designer" />;
}
