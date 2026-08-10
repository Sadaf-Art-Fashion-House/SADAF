/**
 * SADAF | Orders — Canonical Mock Order History
 *
 * The single source of truth for the customer's order history while the
 * backend is not wired. Consumed by:
 *   - /api/dashboard/rewards        → loyalty points & tier (1 point per $1
 *     on Delivered orders, tier derived automatically from lifetime spend)
 *   - /api/dashboard/leaderboard    → the current user's points metric
 *   - /api/dashboard/customer-analysis → the personal orders table
 *
 * Delivered spend is kept near ~$13.4k so the rewards profile matches the
 * "Total Spent" KPI of the analysis page (which also includes in-progress
 * orders). Swap this module for real Prisma queries once the DB is wired —
 * every consumer keeps working because they read the same list.
 */

import type { Order } from '../types';

export const MOCK_ORDERS: Order[] = [
    {
        id: 'SDF-2026-9041',
        date: '2026-05-28',
        total: 1250,
        status: 'Tailoring',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Empress Diwani Abaya Cape',
                productId: 'f-1',
                quantity: 1,
                size: 'M',
                price: 1250,
                image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-9041',
        estimatedDelivery: '2026-07-15',
    },
    {
        id: 'SDF-2026-4412',
        date: '2026-04-12',
        total: 3400,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'The Golden Diwani Diptych',
                productId: 'art-1',
                quantity: 1,
                size: 'Original Framing',
                price: 3400,
                image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-4412',
        estimatedDelivery: '2026-05-01',
    },
    {
        id: 'SDF-2026-2287',
        date: '2026-02-19',
        total: 890,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Gilded Caliph Streetwear Hoodie',
                productId: 'f-4',
                quantity: 1,
                size: 'L',
                price: 890,
                image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-2287',
        estimatedDelivery: '2026-03-01',
    },
    {
        id: 'SDF-2026-1053',
        date: '2025-12-02',
        total: 2150,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Sadaf Inlaid Peak Tuxedo',
                productId: 'f-2',
                quantity: 1,
                size: 'M',
                price: 2150,
                image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-1053',
        estimatedDelivery: '2025-12-20',
    },
    {
        id: 'SDF-2025-8820',
        date: '2025-10-14',
        total: 460,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Royal Heir Linen Set',
                productId: 'f-5',
                quantity: 1,
                size: 'One Size',
                price: 460,
                image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-8820',
        estimatedDelivery: '2025-10-25',
    },
    {
        id: 'SDF-2025-6631',
        date: '2025-08-30',
        total: 1780,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Gilded Caliph Streetwear Hoodie',
                productId: 'f-4',
                quantity: 1,
                size: 'L',
                price: 890,
                image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=300&q=80',
            },
            {
                name: 'Sadaf Inlaid Peak Tuxedo',
                productId: 'f-2',
                quantity: 1,
                size: 'One Size',
                price: 590,
                image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=300&q=80',
            },
            {
                name: 'Royal Heir Linen Set',
                productId: 'f-5',
                quantity: 1,
                size: 'One Size',
                price: 300,
                image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-6631',
        estimatedDelivery: '2025-09-12',
    },
    {
        id: 'SDF-2025-4410',
        date: '2025-06-11',
        total: 1820,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Empress Diwani Abaya Cape',
                productId: 'f-1',
                quantity: 2,
                size: 'M',
                price: 910,
                image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-4410',
        estimatedDelivery: '2025-06-25',
    },
    {
        id: 'SDF-2024-8877',
        date: '2024-12-15',
        total: 1500,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Fatimid Star Silk Slip Dress',
                productId: 'f-3',
                quantity: 1,
                size: 'One Size',
                price: 1500,
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-8877',
        estimatedDelivery: '2024-12-28',
    },
    {
        id: 'SDF-2024-5560',
        date: '2024-09-03',
        total: 1400,
        status: 'Delivered',
        shippingAddress: 'Villa 14, Al-Yasmine District, New Cairo, Egypt',
        items: [
            {
                name: 'Sadaf Inlaid Peak Tuxedo',
                productId: 'f-2',
                quantity: 1,
                size: 'M',
                price: 1400,
                image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=300&q=80',
            },
        ],
        trackingId: 'SDF-TRK-5560',
        estimatedDelivery: '2024-09-15',
    },
];

/**
 * Total spend of orders that reached Delivered — the loyalty points base
 * (1 point per $1). Only delivered orders count; in-progress orders do not
 * grant points until they arrive.
 */
export function sumDeliveredSpend(orders: readonly Pick<Order, 'status' | 'total'>[]): number {
    return orders
        .filter((order) => order.status === 'Delivered')
        .reduce((sum, order) => sum + order.total, 0);
}
