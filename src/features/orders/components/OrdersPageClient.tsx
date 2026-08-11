'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOrderStatus } from '../hooks/useOrderStatus';
import OrdersView from './OrdersView';
import type { Order } from '@/features/orders/types';
import { MOCK_ORDERS } from '../data/mockOrders';
import { ROUTES } from '@/config/routes';
import { getUserReviews, saveUserReview, hasReviewForOrder } from '@/features/reviews/utils/userReviewsStorage';
import { titleForRating } from '@/features/reviews/utils/titleForRating';
import { getMockReviews } from '@/features/reviews/data/mockReviews';
import { useAggregatedRatings } from '@/features/reviews/hooks/useAggregatedRatings';
import type { Review } from '@/features/reviews/types';
import RoleDashboardGuard from '@/shared/components/RoleDashboardGuard';

export default function OrdersPageClient() {
    const [orders] = useState<Order[]>(MOCK_ORDERS);
    const { user } = useAuth();
    const { statuses, events, loading, wsLive, error } = useOrderStatus(user?.id ?? null);

    // Aggregated product ratings (mock catalog reviews + the user's own),
    // matched by product name — order items carry the catalog product name.
    const ratingsByProduct = useAggregatedRatings(
        Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.name)))).map(
            (name) => ({ id: name, name }),
        ),
        getMockReviews(),
    );

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
        <RoleDashboardGuard required="any">
            <OrdersView
                orders={orders}
                liveStatuses={statuses}
                liveEvents={events}
                isLive={wsLive}
                liveLoading={loading}
                liveError={error}
                reviewedOrderIds={reviewedOrderIds}
                ratingsByProduct={ratingsByProduct}
                onReviewSubmit={handleReviewSubmit}
            />
        </RoleDashboardGuard>
    );
}
