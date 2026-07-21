import type { Metadata } from 'next';
import CartPageClient from '@/features/cart/components/CartPageClient';

export const metadata: Metadata = {
    title: 'Shopping Bag | SADAF Atelier',
    description:
        'Review your SADAF shopping bag — fashion, fine art, and AI Studio custom designs, ready for checkout.',
};

export default function CartPage() {
    return <CartPageClient />;
}
