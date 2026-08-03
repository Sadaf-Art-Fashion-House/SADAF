/**
 * SADAF | API Route — Customer Personal Analysis
 *
 * GET /api/dashboard/customer-analysis?userId=<id>
 *
 * Returns customer-specific personal analytics: KPIs (total spent, orders,
 * wishlist, AI designs), order history, monthly spending, and category
 * breakdown. Values include slight real-time jitter so the page feels live.
 *
 * Currently serves generated demo data scoped per-user. Swap the mock base
 * for Prisma/database queries in production (filter orders, wishlist, and
 * AI designs by userId).
 */

import { NextResponse } from 'next/server';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CustomerAnalysisData, CustomerOrder, CustomerSpendingPoint, CustomerCategorySpend } from '@/features/customer/types';

/**
 * Never cache: personal stats change as the customer shops.
 */
export const dynamic = 'force-dynamic';

// ─── In-memory counters (simulates live personal activity) ─────────────────

const MOCK_ORDERS: CustomerOrder[] = [
    { id: 'SDF-2026-9041', date: '2026-05-28', total: 1250, status: 'Tailoring', items: 1 },
    { id: 'SDF-2026-4412', date: '2026-04-12', total: 3400, status: 'Delivered', items: 2 },
    { id: 'SDF-2026-2287', date: '2026-02-19', total: 890, status: 'Delivered', items: 1 },
    { id: 'SDF-2026-1053', date: '2025-12-02', total: 2150, status: 'Delivered', items: 1 },
    { id: 'SDF-2025-8820', date: '2025-10-14', total: 460, status: 'Delivered', items: 1 },
    { id: 'SDF-2025-6631', date: '2025-08-30', total: 1780, status: 'Delivered', items: 3 },
];

// The Orders KPI mirrors the visible table rows exactly — no phantom orders.
const ORDER_COUNT = MOCK_ORDERS.length;

let simulatedAiDesignCount = 12;

const MOCK_MONTHLY_SPENDING: CustomerSpendingPoint[] = [
    { month: 'Sep', value: 420 },
    { month: 'Oct', value: 680 },
    { month: 'Nov', value: 940 },
    { month: 'Dec', value: 1520 },
    { month: 'Jan', value: 760 },
    { month: 'Feb', value: 890 },
    { month: 'Mar', value: 1240 },
    { month: 'Apr', value: 3400 },
    { month: 'May', value: 1250 },
    { month: 'Jun', value: 540 },
    { month: 'Jul', value: 980 },
    { month: 'Aug', value: 1120 },
];

const MOCK_CATEGORY_SPEND: CustomerCategorySpend[] = [
    { category: 'Traditional Fusion', value: 4230, color: '#C9A84C' },
    { category: 'Women', value: 2560, color: '#4FC3F7' },
    { category: 'Men', value: 1240, color: '#10B981' },
    { category: 'Art Pieces', value: 3400, color: '#8B5CF6' },
    { category: 'Limited Edition', value: 890, color: '#F59E0B' },
];

/** Jitter a number by ±pct% (min 0). */
function jitter(value: number, pct = 0.05): number {
    const delta = value * (Math.random() * 2 - 1) * pct;
    return Math.max(0, Math.round(value + delta));
}

export async function GET(request: Request) {
    try {
        // userId accepted for API parity; demo data is global for now.
        const userId = new URL(request.url).searchParams.get('userId');

        // Advance live counters
        simulatedAiDesignCount += Math.floor(Math.random() * 3);

        const monthlySpending = MOCK_MONTHLY_SPENDING.map((point) => ({
            month: point.month,
            value: jitter(point.value, 0.08),
        }));

        const categorySpend = MOCK_CATEGORY_SPEND.map((cat) => ({
            ...cat,
            value: jitter(cat.value, 0.06),
        }));

        const totalSpent = monthlySpending.reduce((sum, point) => sum + point.value, 0);
        const wishlistValue = 5840 + Math.floor(Math.random() * 400);
        const averageOrderValue = Math.round(totalSpent / Math.max(1, ORDER_COUNT));

        const kpis = [
            { label: 'Total Spent', value: formatCurrency(totalSpent), change: '+14.6%', isPositive: true, icon: 'Wallet' },
            { label: 'Orders', value: `${ORDER_COUNT}`, change: '+12.5%', isPositive: true, icon: 'ShoppingBag' },
            { label: 'Wishlist Value', value: formatCurrency(wishlistValue), change: '+6.2%', isPositive: true, icon: 'Heart' },
            { label: 'AI Designs', value: `${simulatedAiDesignCount}`, change: '+24.8%', isPositive: true, icon: 'Cpu' },
        ];

        const data: CustomerAnalysisData = {
            kpis,
            orders: MOCK_ORDERS.map((order) => ({
                ...order,
                total: jitter(order.total, 0.02),
            })),
            monthlySpending,
            categorySpend,
            averageOrderValue,
            tier: 'Heritage Gold Member',
            wishlistValue,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({
            ...data,
            userId,
        });
    } catch (error) {
        console.error('Customer analysis data error:', error);
        return NextResponse.json(
            { error: 'Failed to load personal analysis' },
            { status: 500 }
        );
    }
}
