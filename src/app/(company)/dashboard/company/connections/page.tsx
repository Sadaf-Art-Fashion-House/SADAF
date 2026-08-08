import type { Metadata } from 'next';
import ConnectionsPageClient from '@/features/connections/components/ConnectionsPageClient';

export const metadata: Metadata = {
    title: 'Connections | SADAF Company',
    description: 'Discover SADAF designers, review their portfolios, and open collaboration requests.',
};

export default function CompanyConnectionsPage() {
    return <ConnectionsPageClient role="company" />;
}
