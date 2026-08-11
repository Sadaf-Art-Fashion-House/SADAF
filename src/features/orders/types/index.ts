export interface OrderItem {
    name: string;
    /** Catalog id the item was ordered from (fashionDatabase / artDatabase) —
     * lets old saved orders resolve the live localized name instead of the
     * English name captured at order time. */
    productId?: string;
    quantity: number;
    size: string;
    price: number;
    image: string;
}

export type OrderStatus = 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';

export interface Order {
    id: string;
    date: string;
    total: number;
    status: OrderStatus;
    items: OrderItem[];
    shippingAddress: string;
    trackingId?: string;
    estimatedDelivery?: string;
}

/** Real-time order status transition pushed per user via the WS channel. */
export interface OrderStatusEvent {
    /** Unique id — consumers dedupe by this when appending. */
    id: string;
    /** Order this transition belongs to. */
    orderId: string;
    /** Status before the update. */
    previousStatus: OrderStatus;
    /** New status after the update. */
    status: OrderStatus;
    /** One-line human-readable update (e.g. courier note). */
    message: string;
    /** ISO timestamp of when the transition happened. */
    timestamp: string;
    /** The user this event belongs to. */
    userId: string;
}
