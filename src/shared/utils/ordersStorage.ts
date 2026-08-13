/**
 * SADAF | Orders — Sandbox Order Storage
 *
 * Persists placed orders in localStorage so the dashboard can reference
 * them. In production this is replaced by the backend orders table; the
 * storage key and API stay identical.
 *
 * Uses the shared localStorage sync utility (custom window event + native
 * storage event) so the orders dashboard reflects a newly placed order
 * instantly, even from another tab.
 */

import { createLocalStorageSync } from '@/shared/utils/localStorageSync';
import type { OrderPayload } from '@/features/checkout/types';

const STORAGE_KEY = 'sadaf_orders';
const CHANGED_EVENT = 'sadaf:orders-changed';

/**
 * Persistence + cross-tab sync (custom window event + native storage event)
 * so a newly placed order appears in the orders dashboard immediately.
 */
const ordersSync = createLocalStorageSync<OrderPayload[]>(STORAGE_KEY, CHANGED_EVENT);

/** Retrieve all placed orders (newest first). */
export function getPlacedOrders(): OrderPayload[] {
    const stored = ordersSync.load();
    return Array.isArray(stored) ? stored : [];
}

/**
 * Prepend a newly placed order to the persisted list and notify listeners
 * (same-tab custom event + cross-tab storage event).
 */
export function savePlacedOrder(order: OrderPayload): void {
    const existing = getPlacedOrders();
    ordersSync.save([order, ...existing]);
}

/**
 * Subscribe to order changes (in-tab custom event + cross-tab `storage`
 * event). Returns an unsubscribe function — the orders dashboard uses it to
 * refresh the moment a new order lands.
 */
export function subscribePlacedOrders(listener: () => void): () => void {
    return ordersSync.subscribe(listener);
}
