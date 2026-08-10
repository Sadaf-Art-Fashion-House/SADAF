import type { Metadata } from 'next';
import CommissionHistoryPageClient from '@/features/commissions/components/CommissionHistoryPageClient';

export const metadata: Metadata = {
    title: 'Commission History | SADAF Atelier',
    description: 'Your referral commission ledger — paid and pending payouts across months.',
};

export default function SalesPartnerCommissionsPage() {
    return <CommissionHistoryPageClient kind="sales-partner" />;
}
