'use client';

import ReviewsView from './ReviewsView';
import type { Review } from '../types';

interface ReviewsPageClientProps {
    reviews: Review[];
}

export default function ReviewsPageClient({ reviews }: ReviewsPageClientProps) {
    return <ReviewsView reviews={reviews} />;
}
