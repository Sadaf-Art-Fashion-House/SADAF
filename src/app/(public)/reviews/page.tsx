import type { Metadata } from 'next';
import ReviewsPageClient from '@/features/reviews/components/ReviewsPageClient';
import type { Review } from '@/features/reviews/types';

export const metadata: Metadata = {
    title: 'Customer Reviews | SADAF Atelier',
    description: 'Read reviews from SADAF customers across fashion, artworks, and collections.',
};

// TODO: Replace with real Supabase/Prisma query
async function getReviews(): Promise<Review[]> {
    return [];
}

export default async function ReviewsPage() {
    const reviews = await getReviews();
    return <ReviewsPageClient reviews={reviews} />;
}
