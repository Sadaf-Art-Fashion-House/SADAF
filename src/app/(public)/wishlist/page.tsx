import type { Metadata } from 'next';
import WishlistPageClient from '@/features/wishlist/components/WishlistPageClient';
import { getMockReviews } from '@/features/reviews/data/mockReviews';

export const metadata: Metadata = {
    title: 'Wishlist | SADAF Atelier',
    description:
        'Your saved SADAF pieces — fashion, art, and designs you love, ready to add to your bag.',
};

export default async function WishlistPage() {
    // Catalog reviews feed the aggregated card ratings (merged with the
    // signed-in user's own reviews client-side — see useAggregatedRatings).
    const mockReviews = getMockReviews();

    return <WishlistPageClient mockReviews={mockReviews} />;
}
