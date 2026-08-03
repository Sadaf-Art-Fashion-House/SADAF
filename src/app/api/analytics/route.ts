/**
 * SADAF | API Route — Analytics Data
 *
 * GET /api/analytics — Returns the full AnalyticsData payload (KPIs, weekly
 * & monthly revenue, category sales, top products, user growth, acquisition
 * channels, revenue by channel) with slight real-time jitter so live
 * consumers (WebSocket / SSE / polling) see data move on every poll.
 *
 * Also maintains an in-memory ring buffer of recent live events (orders,
 * signups, AI generations, reviews, promotions) and appends 0–2 fresh
 * events per poll, so the Live Events Feed streams new entries roughly
 * every WS poll cycle (3s).
 *
 * The WebSocket server (ws-server.mjs) polls this endpoint and broadcasts it
 * as `analytics:admin`. Swap the mock base for Prisma/database queries in
 * production.
 */

import { NextResponse } from 'next/server';
import { MOCK_ANALYTICS_DATA, MOCK_LIVE_EVENTS } from '@/features/analytics/constants/analyticsData';
import type { AnalyticsData, ChartDataPoint, CategorySales, TopProduct, UserGrowthDataPoint, LiveEvent } from '@/features/analytics/types';

/**
 * Never cache this route: the payload is intentionally different on every
 * poll (live jitter + counters). Without this, Next.js statically caches
 * GET Route Handlers in production builds and the real-time feed freezes.
 */
export const dynamic = 'force-dynamic';

// ─── In-memory counters (simulates live activity) ─────────────────────────

let orderCount = 342;
let aiGenerationCount = 1294;
let activeCustomerCount = 1247;

// ─── Live events ring buffer (most recent first) ────────────────────────────

const MAX_LIVE_EVENTS = 24;
let liveEventCounter = MOCK_LIVE_EVENTS.length;
let liveEvents: LiveEvent[] = [...MOCK_LIVE_EVENTS].reverse(); // oldest → newest for appends

/** Build a fresh event with a unique id and current timestamp. */
function makeEvent(type: LiveEvent['type'], title: string, message: string): LiveEvent {
    return {
        id: `evt-${type}-${Date.now()}-${++liveEventCounter}`,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
    };
}

/** Event templates keyed by type — each poll picks a random weighted type. */
const EVENT_TEMPLATES: Record<LiveEvent['type'], () => LiveEvent> = {
    order: () => makeEvent(
        'order',
        'New order received',
        `Order #SADAF-${1000 + Math.floor(Math.random() * 900)} · $${(80 + Math.random() * 1200).toFixed(0)} — new atelier piece`,
    ),
    signup: () => makeEvent(
        'signup',
        'New customer joined',
        'A new customer registered via referral program',
    ),
    ai: () => makeEvent(
        'ai',
        'AI design generated',
        'User rendered a new couture concept in AI Studio',
    ),
    review: () => makeEvent(
        'review',
        'New review posted',
        `A customer left a ${Math.random() > 0.3 ? '5' : '4'}-star review on a recent piece`,
    ),
    promotion: () => makeEvent(
        'promotion',
        'Promotion claimed',
        'A limited-time offer was claimed by a customer',
    ),
};

/** Weighted pick: orders & AI generations are most frequent. */
const EVENT_TYPE_WEIGHTS: { type: LiveEvent['type']; weight: number }[] = [
    { type: 'order', weight: 4 },
    { type: 'ai', weight: 3 },
    { type: 'signup', weight: 2 },
    { type: 'review', weight: 2 },
    { type: 'promotion', weight: 1 },
];

function pickEventType(): LiveEvent['type'] {
    const total = EVENT_TYPE_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of EVENT_TYPE_WEIGHTS) {
        roll -= entry.weight;
        if (roll <= 0) return entry.type;
    }
    return 'order';
}

/** Append 0–2 fresh events per poll and keep the buffer capped. */
function pushLiveEvents() {
    const newCount = Math.random() > 0.45 ? (Math.random() > 0.5 ? 2 : 1) : 0;
    for (let i = 0; i < newCount; i++) {
        liveEvents.push(EVENT_TEMPLATES[pickEventType()]());
    }
    if (liveEvents.length > MAX_LIVE_EVENTS) {
        liveEvents = liveEvents.slice(-MAX_LIVE_EVENTS);
    }
}

/** Jitter a number by ±pct% (min 0). */
function jitter(value: number, pct = 0.04): number {
    const delta = value * (Math.random() * 2 - 1) * pct;
    return Math.max(0, Math.round(value + delta));
}

/** Jitter a ChartDataPoint, preserving its label and previousValue. */
function jitterChartPoint(point: ChartDataPoint, pct = 0.05): ChartDataPoint {
    return {
        label: point.label,
        value: jitter(point.value, pct),
        ...(point.previousValue !== undefined
            ? { previousValue: jitter(point.previousValue, pct) }
            : {}),
    };
}

/** Jitter a CategorySales row, keeping color but recomputing share. */
function jitterCategorySales(cat: CategorySales): CategorySales {
    const revenue = jitter(cat.revenue, 0.06);
    const unitsSold = jitter(cat.unitsSold, 0.06);
    return { ...cat, revenue, unitsSold, share: 0 }; // share recomputed below
}

/** Jitter a TopProduct row. */
function jitterTopProduct(product: TopProduct): TopProduct {
    return {
        ...product,
        revenue: jitter(product.revenue, 0.06),
        unitsSold: jitter(product.unitsSold, 0.06),
        growth: Math.round(product.growth * (1 + (Math.random() * 0.2 - 0.1))) / 10,
    };
}

/** Jitter a UserGrowthDataPoint. */
function jitterUserGrowth(point: UserGrowthDataPoint): UserGrowthDataPoint {
    return {
        month: point.month,
        total: jitter(point.total, 0.02),
        newUsers: jitter(point.newUsers, 0.08),
        activeUsers: jitter(point.activeUsers, 0.05),
    };
}

export async function GET() {
    try {
        // Advance live counters
        orderCount += Math.floor(Math.random() * 3);
        aiGenerationCount += Math.floor(Math.random() * 4);
        activeCustomerCount += Math.floor(Math.random() * 5) - 1;

        // Append fresh events for the Live Events Feed
        pushLiveEvents();

        // Jitter every series
        const weeklyRevenue = MOCK_ANALYTICS_DATA.weeklyRevenue.map((d) => jitterChartPoint(d, 0.07));
        const monthlyRevenue = MOCK_ANALYTICS_DATA.monthlyRevenue.map((d) => jitterChartPoint(d, 0.04));
        const categorySales = MOCK_ANALYTICS_DATA.categorySales.map(jitterCategorySales);
        const topProducts = MOCK_ANALYTICS_DATA.topProducts.map(jitterTopProduct);
        const userGrowth = MOCK_ANALYTICS_DATA.userGrowth.map(jitterUserGrowth);
        const acquisitionChannels = MOCK_ANALYTICS_DATA.acquisitionChannels.map((d) => jitterChartPoint(d, 0.06));
        const revenueByChannel = MOCK_ANALYTICS_DATA.revenueByChannel.map((d) => jitterChartPoint(d, 0.05));

        // Recompute category shares so they sum to 100%
        const categoryTotal = categorySales.reduce((sum, c) => sum + c.revenue, 0) || 1;
        categorySales.forEach((c) => {
            c.share = Math.round((c.revenue / categoryTotal) * 1000) / 10;
        });

        // Recompute KPIs from the jittered series (no stale strings)
        const totalRevenue = monthlyRevenue.reduce((sum, d) => sum + d.value, 0);
        const totalOrders = orderCount;

        const kpis = [
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+18.2%', isPositive: true, icon: 'TrendingUp' },
            { label: 'Orders', value: totalOrders.toLocaleString(), change: '+12.5%', isPositive: true, icon: 'ShoppingBag' },
            { label: 'Active Customers', value: activeCustomerCount.toLocaleString(), change: '+9.4%', isPositive: true, icon: 'Users' },
            { label: 'Avg Order Value', value: `$${totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : '0'}`, change: '+5.8%', isPositive: true, icon: 'DollarSign' },
            { label: 'Conversion Rate', value: `${(2.8 + Math.random() * 0.8).toFixed(1)}%`, change: '-0.4%', isPositive: false, icon: 'TrendingDown' },
            { label: 'AI Designs Created', value: aiGenerationCount.toLocaleString(), change: '+24.8%', isPositive: true, icon: 'Cpu' },
        ];

        const data: AnalyticsData = {
            kpis,
            weeklyRevenue,
            monthlyRevenue,
            categorySales,
            topProducts,
            userGrowth,
            acquisitionChannels,
            revenueByChannel,
            liveEvents: [...liveEvents].reverse(), // most recent first for the feed
        };

        return NextResponse.json({
            ...data,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Analytics data error:', error);
        return NextResponse.json(
            { error: 'Failed to load analytics data' },
            { status: 500 }
        );
    }
}
