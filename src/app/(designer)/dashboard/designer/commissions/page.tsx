import type { Metadata } from 'next';
import CommissionHistoryPageClient from '@/features/commissions/components/CommissionHistoryPageClient';

export const metadata: Metadata = {
    title: 'Commission History | SADAF Atelier',
    description: 'Your atelier commission ledger — paid and pending payouts across months.',
};

export default function DesignerCommissionsPage() {
    return <CommissionHistoryPageClient kind="designer" />;
}
