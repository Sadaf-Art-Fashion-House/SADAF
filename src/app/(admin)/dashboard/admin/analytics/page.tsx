import type { Metadata } from 'next';
import AnalyticsPageClient from '@/features/analytics/components/AnalyticsPageClient';

export const metadata: Metadata = {
    title: 'Analytics | Admin Dashboard — SADAF Atelier',
    description: 'Platform analytics — revenue, sales, products, and user growth metrics.',
};

export default function AdminAnalyticsPage() {
    return <AnalyticsPageClient role="admin" />;
}
