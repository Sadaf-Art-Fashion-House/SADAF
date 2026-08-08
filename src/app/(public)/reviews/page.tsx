import type { Metadata } from 'next';
import ReviewsPageClient from '@/features/reviews/components/ReviewsPageClient';
import { getMockReviews } from '@/features/reviews/data/mockReviews';

export const metadata: Metadata = {
    title: 'Customer Reviews | SADAF Atelier',
    description: 'Read reviews from SADAF customers across fashion, artworks, and collections.',
};

export default async function ReviewsPage() {
    const reviews = getMockReviews();
    return <ReviewsPageClient reviews={reviews} />;
}
