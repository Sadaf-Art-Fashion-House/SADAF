'use client';

import { useState } from 'react';
import OrdersView from './OrdersView';
import type { Order } from '@/features/orders/types';

const SIMULATED_ORDERS: Order[] = [
    {
        id: 'SDF-2026-9041',
        date: '2026-05-28',
        total: 1250,
        status: 'Tailoring',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Al-Muizz El-Faraeda Abaya',
                quantity: 1,
                size: 'M',
                price: 1250,
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-9041',
        estimatedDelivery: '2026-07-15',
    },
    {
        id: 'SDF-2026-4412',
        date: '2026-04-12',
        total: 3400,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'The Golden Diwani Diptych Fine Art',
                quantity: 1,
                size: 'Original Framing',
                price: 3400,
                image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-4412',
        estimatedDelivery: '2026-05-01',
    },
];

export default function OrdersPageClient() {
    const [orders] = useState<Order[]>(SIMULATED_ORDERS);

    return <OrdersView orders={orders} />;
}
