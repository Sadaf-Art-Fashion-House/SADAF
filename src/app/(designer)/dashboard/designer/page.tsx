import type { Metadata } from 'next';
import DesignerDashboardPageClient from '@/features/designer/components/DesignerDashboardPageClient';

export const metadata: Metadata = {
    title: 'Designer Dashboard | SADAF Atelier',
    description: 'Submit original designs to the atelier and track them through review and production.',
};

export default function DesignerPage() {
    return <DesignerDashboardPageClient />;
}
