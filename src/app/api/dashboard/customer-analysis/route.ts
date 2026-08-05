/**
 * SADAF | API Route — Customer Personal Analysis
 *
 * GET /api/dashboard/customer-analysis?userId=<id>
 *
 * Returns customer-specific personal analytics: KPIs (total spent, orders,
 * wishlist, AI designs), order history, monthly spending, category
 * breakdown, and smart product recommendations matched to the customer's
 * top spending categories (e.g. heavy Traditional Fusion spenders get
 * Traditional Fusion offers).
 *
 * Values include slight real-time jitter so the page feels live.
 *
 * Currently serves generated demo data scoped per-user. Swap the mock base
 * for Prisma/database queries in production (filter orders, wishlist, and
 * AI designs by userId; pull real product offers from the catalog).
 */

import { NextResponse } from 'next/server';
import { formatCurrency } from '@/utils/formatCurrency';
import { ROUTES } from '@/config/routes';
import type {
    CustomerAnalysisData,
    CustomerOrder,
    CustomerSpendingPoint,
    CustomerCategorySpend,
    ProductRecommendation,
} from '@/features/customer/types';

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

// ─── Smart Recommendation Engine ─────────────────────────────────────────────
// Matches offers to the customer's top spending categories. In production,
// replace the static offers with real catalog rows (Prisma products) filtered
// by category.

interface RecommendationOffer {
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    href: string;
}

/** Static offer pool keyed by category (the key IS the category). */
const OFFER_POOL: Record<string, RecommendationOffer[]> = {
    'Traditional Fusion': [
        {
            title: 'Heritage Fusion Abaya',
            description: 'Hand-embroidered abaya with gold-thread details.',
            price: 1250,
            originalPrice: 1480,
            href: `${ROUTES.FASHION}?category=Traditional+Fusion`,
        },
        {
            title: 'Omani-Born Kaftan',
            description: 'Signature silhouette cut from premium woven cotton.',
            price: 890,
            originalPrice: 1050,
            href: `${ROUTES.FASHION}?category=Traditional+Fusion`,
        },
    ],
    Women: [
        {
            title: 'Pearl Evening Gown',
            description: 'Hand-beaded gown from the spring atelier collection.',
            price: 1620,
            originalPrice: 1900,
            href: `${ROUTES.FASHION}?category=Women`,
        },
    ],
    Men: [
        {
            title: 'Tailored Heritage Thobe',
            description: 'Slim-fit thobe with cuff embroidery — limited fabric.',
            price: 780,
            originalPrice: 920,
            href: `${ROUTES.FASHION}?category=Men`,
        },
    ],
    'Art Pieces': [
        {
            title: 'Fusion Canvas — Original',
            description: 'One-of-one mixed-media piece by a SADAF artist.',
            price: 2400,
            originalPrice: 2750,
            href: ROUTES.ARTWORKS,
        },
    ],
    'Limited Edition': [
        {
            title: 'Limited Edition Wrap',
            description: 'Numbered piece — only 25 produced worldwide.',
            price: 1350,
            originalPrice: 1600,
            href: ROUTES.STORE,
        },
    ],
};

const OFFER_REASONS: Record<string, string> = {
    'Traditional Fusion': "Your most-loved category — we saved a special price for you.",
    Women: "You've been exploring the women's collection lately.",
    Men: "Matches your recent men's tailoring orders.",
    'Art Pieces': "Based on your art purchases, this may speak to you.",
    'Limited Edition': 'You collect limited pieces — this one is nearly gone.',
};

/**
 * Rank the customer's spending categories and return a matching offer per
 * top category (up to 3 total). Falls back to a curated pick if no category
 * has a matching offer.
 */
function buildRecommendations(categorySpend: CustomerCategorySpend[]): ProductRecommendation[] {
    const ranked = [...categorySpend].sort((a, b) => b.value - a.value);
    const topCategories = ranked.slice(0, 3);

    const recommendations: ProductRecommendation[] = [];

    for (const cat of topCategories) {
        const offers = OFFER_POOL[cat.category];
        if (!offers || offers.length === 0) continue;
        const offer = offers[0];
        recommendations.push({
            id: `rec-${cat.category}-${offer.title}`,
            category: cat.category,
            title: offer.title,
            description: offer.description,
            price: offer.price,
            originalPrice: offer.originalPrice,
            discountPercent: Math.round((1 - offer.price / offer.originalPrice) * 100),
            reason: OFFER_REASONS[cat.category] ?? `Popular in ${cat.category}.`,
            href: offer.href,
        });
        if (recommendations.length >= 3) break;
    }

    // Fallback: if nothing matched (empty pool), return a generic featured pick.
    if (recommendations.length === 0) {
        const fallback = OFFER_POOL['Limited Edition'][0];
        recommendations.push({
            id: `rec-fallback-${fallback.title}`,
            category: 'Limited Edition',
            title: fallback.title,
            description: fallback.description,
            price: fallback.price,
            originalPrice: fallback.originalPrice,
            discountPercent: Math.round((1 - fallback.price / fallback.originalPrice) * 100),
            reason: 'A curated pick for you this week.',
            href: fallback.href,
        });
    }

    return recommendations;
}

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
            recommendations: buildRecommendations(categorySpend),
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
