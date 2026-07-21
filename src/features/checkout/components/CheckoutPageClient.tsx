'use client';

import { useRouter } from 'next/navigation';
import { useCartStore } from '@/features/cart/store/useCartStore';
import CheckoutView from './CheckoutView';
import type { OrderPayload } from '../types';

export default function CheckoutPageClient() {
    const router = useRouter();
    const items = useCartStore((state) => state.items);
    const subtotal = useCartStore((state) => state.getSubtotal());
    const clearCart = useCartStore((state) => state.clearCart);

    const handlePlaceOrder = (order: OrderPayload) => {
        // Persist order to localStorage for dashboard reference
        const existingOrders = JSON.parse(localStorage.getItem('sadaf_orders') || '[]');
        existingOrders.unshift(order);
        localStorage.setItem('sadaf_orders', JSON.stringify(existingOrders));

        // Clear the cart after successful order
        clearCart();
    };

    const handleGoBackToCart = () => {
        router.push('/cart');
    };

    return (
        <CheckoutView
            items={items}
            subtotal={subtotal}
            onPlaceOrder={handlePlaceOrder}
            onGoBackToCart={handleGoBackToCart}
        />
    );
}
