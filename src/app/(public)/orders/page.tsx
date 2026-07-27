import type { Metadata } from 'next';
import OrdersPageClient from '@/features/orders/components/OrdersPageClient';

export const metadata: Metadata = {
    title: 'Orders | SADAF Atelier',
    description:
        'Track your SADAF orders — from tailoring to delivery. View the status of your bespoke pieces and heritage items.',
};

export default function OrdersPage() {
    return <OrdersPageClient />;
}
