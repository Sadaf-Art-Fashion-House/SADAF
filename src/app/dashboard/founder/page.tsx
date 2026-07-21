import type { Metadata } from 'next';
import FounderDashboardPageClient from './FounderDashboardPageClient';

export const metadata: Metadata = {
    title: 'Founder Dashboard | SADAF Atelier',
    description: 'Executive oversight — analytics, revenue, and team management.',
};

export default function FounderPage() {
    return <FounderDashboardPageClient />;
}
