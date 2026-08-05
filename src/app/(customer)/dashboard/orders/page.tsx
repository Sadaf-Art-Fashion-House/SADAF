import type { Metadata } from 'next';
import OrdersPageClient from '@/features/orders/components/OrdersPageClient';

export const metadata: Metadata = {
    title: 'Orders | SADAF Atelier',
    description:
        'Track your SADAF orders in real time — from tailoring to delivery. Live status updates as your pieces move through the atelier.',
};

export default function DashboardOrdersPage() {
    return <OrdersPageClient />;
}
