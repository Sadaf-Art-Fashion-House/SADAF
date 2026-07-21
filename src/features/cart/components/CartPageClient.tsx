'use client';

import { useCartStore } from '@/features/cart/store/useCartStore';
import CartView from './CartView';

export default function CartPageClient() {
    const items = useCartStore((state) => state.items);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const clearCart = useCartStore((state) => state.clearCart);

    const handleUpdateQuantity = (cartLineId: string, quantity: number) => {
        updateQuantity(cartLineId, quantity);
    };

    const handleRemoveFromCart = (cartLineId: string) => {
        removeFromCart(cartLineId);
    };

    const handleClearCart = () => {
        clearCart();
    };

    return (
        <CartView
            items={items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
        />
    );
}
