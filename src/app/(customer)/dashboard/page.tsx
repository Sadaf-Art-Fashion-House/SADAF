import type { Metadata } from 'next';
import DashboardPageClient from '@/features/dashboard/components/DashboardPageClient';

export const metadata: Metadata = {
    title: 'Dashboard | SADAF Atelier',
    description: 'Your SADAF account dashboard.',
};

export default function DashboardPage() {
    return <DashboardPageClient />;
}
