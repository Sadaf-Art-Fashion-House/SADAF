import type { Metadata } from 'next';
import CustomerAnalysisPageClient from '@/features/customer/components/CustomerAnalysisPageClient';

export const metadata: Metadata = {
    title: 'Personal Analysis | SADAF Atelier',
    description: 'Your personal spending, orders, and creative insights.',
};

export default function CustomerAnalysisPage() {
    return <CustomerAnalysisPageClient />;
}
