import type { Metadata } from 'next';
import WishlistPageClient from '@/features/wishlist/components/WishlistPageClient';

export const metadata: Metadata = {
    title: 'Wishlist | SADAF Atelier',
    description:
        'Your saved SADAF pieces — fashion, art, and designs you love, ready to add to your bag.',
};

export default function WishlistPage() {
    return <WishlistPageClient />;
}
