'use client';

import { useCartStore } from '@/features/cart/store/useCartStore';
import RoleDashboardGuard from '@/shared/components/RoleDashboardGuard';
import { savePlacedOrder } from '@/shared/utils/ordersStorage';
import CheckoutView from './CheckoutView';
import type { OrderPayload } from '../types';

export default function CheckoutPageClient() {
    const items = useCartStore((state) => state.items);
    const subtotal = useCartStore((state) => state.getSubtotal());
    const clearCart = useCartStore((state) => state.clearCart);

    const handlePlaceOrder = (order: OrderPayload) => {
        // Persist order to localStorage for dashboard reference (sandbox).
        savePlacedOrder(order);

        // Clear the cart after successful order
        clearCart();
    };

    return (
        <RoleDashboardGuard required="any">
            <CheckoutView
                items={items}
                subtotal={subtotal}
                onPlaceOrder={handlePlaceOrder}
            />
        </RoleDashboardGuard>
    );
}
