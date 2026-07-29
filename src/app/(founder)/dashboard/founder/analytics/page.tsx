import type { Metadata } from 'next';
import AnalyticsPageClient from '@/features/analytics/components/AnalyticsPageClient';

export const metadata: Metadata = {
    title: 'Analytics | Founder Dashboard — SADAF Atelier',
    description: 'Executive analytics — revenue, growth, and platform performance metrics.',
};

export default function FounderAnalyticsPage() {
    return <AnalyticsPageClient role="founder" />;
}
