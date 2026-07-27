export interface OrderItem {
    name: string;
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
