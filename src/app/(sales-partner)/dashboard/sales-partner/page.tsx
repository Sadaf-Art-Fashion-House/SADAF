import type { Metadata } from 'next';
import SalesPartnerDashboardPageClient from '@/features/sales-partner/components/SalesPartnerDashboardPageClient';

export const metadata: Metadata = {
    title: 'Sales Partner Dashboard | SADAF Atelier',
    description: 'Your referral link, commissions, and converted customers.',
};

export default function SalesPartnerPage() {
    return <SalesPartnerDashboardPageClient />;
}
