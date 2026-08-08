'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOrderStatus } from '../hooks/useOrderStatus';
import OrdersView from './OrdersView';
import type { Order } from '@/features/orders/types';
import { ROUTES } from '@/config/routes';
import { getUserReviews, saveUserReview, hasReviewForOrder } from '@/features/reviews/utils/userReviewsStorage';
import type { Review } from '@/features/reviews/types';

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

/** Short review titles derived from the star rating. */
function titleForRating(rating: number): string {
    if (rating >= 5) return 'Exceptional — exceeded every expectation';
    if (rating === 4) return 'Loved my SADAF piece';
    if (rating === 3) return 'Good, with room to improve';
    if (rating === 2) return 'Not quite what I expected';
    return 'Disappointed with the experience';
}

export default function OrdersPageClient() {
    const [orders] = useState<Order[]>(SIMULATED_ORDERS);
    const { user } = useAuth();
    const { statuses, events, loading, wsLive, error } = useOrderStatus(user?.id ?? null);

    // Order ids that already have a review — read on mount (hydration-safe,
    // per signed-in user) and updated optimistically after each submit.
    const [reviewedOrderIds, setReviewedOrderIds] = useState<string[]>([]);
    useEffect(() => {
        setReviewedOrderIds(getUserReviews(user?.id ?? '').map((review) => review.orderId).filter(Boolean) as string[]);
    }, [user?.id]);

    const handleReviewSubmit = useCallback(
        async (order: Order, rating: number, comment: string): Promise<{ ok: boolean; error?: string }> => {
            try {
                if (hasReviewForOrder(order.id, user?.id ?? '')) {
                    return { ok: false, error: 'This order already has a review.' };
                }

                const review: Review = {
                    id: `user-review-${Date.now()}`,
                    productId: order.id,
                    productName: order.items[0]?.name ?? 'SADAF piece',
                    productImage: order.items[0]?.image ?? '',
                    productHref: ROUTES.STORE,
                    userName: user?.fullName ?? 'SADAF Client',
                    userAvatar: user?.avatarUrl,
                    rating,
                    title: titleForRating(rating),
                    comment,
                    createdAt: new Date().toISOString(),
                    verified: true,
                    orderId: order.id,
                };

                saveUserReview(review, user?.id ?? '');
                setReviewedOrderIds((current) => [...current, order.id]);
                return { ok: true };
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Could not save your review';
                return { ok: false, error: message };
            }
        },
        [user],
    );

    return (
        <OrdersView
            orders={orders}
            liveStatuses={statuses}
            liveEvents={events}
            isLive={wsLive}
            liveLoading={loading}
            liveError={error}
            reviewedOrderIds={reviewedOrderIds}
            onReviewSubmit={handleReviewSubmit}
        />
    );
}
