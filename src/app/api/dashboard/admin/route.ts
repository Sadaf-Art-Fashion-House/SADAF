/**
 * SADAF | API Route — Admin Dashboard Data
 *
 * GET /api/dashboard/admin — Returns computed KPIs, products, arts, orders,
 * customers, and AI telemetry derived from the catalog in data.ts.
 *
 * Swap data.ts imports for Prisma/database calls in production.
 */

import { NextResponse } from 'next/server';
import { fashionDatabase, artDatabase } from '@/data';

// ─── In-memory counters (simulates real-time activity) ─────────────────────

let viewCount = Math.floor(Math.random() * 200) + 300;
let aiGenerationCount = 1294;

/** Simulated orders. */
const recentOrders = [
    { id: 'SDF-2026-9041', customerName: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', date: '2026-06-01', total: 1250, status: 'Tailoring' as const, itemNames: 'Al-Muizz El-Faraeda Abaya (1)' },
    { id: 'SDF-2026-8802', customerName: 'Karim Mansour', email: 'karim@mansour.eg', date: '2026-05-30', total: 580, status: 'Pending' as const, itemNames: 'Diwani Calligraphy Streetwear Coach Jacket (1)' },
    { id: 'SDF-2026-4412', customerName: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', date: '2026-05-15', total: 3400, status: 'Delivered' as const, itemNames: 'The Golden Diwani Diptych Fine Art (1)' },
];

/** Simulated customer roster. */
const customers = [
    { id: 'cst-1', name: 'Layla Al-Khouri', email: 'customer@sadaf.luxury', level: 'Gold Lineage VVIP', joinDate: '2026-01-14' },
    { id: 'cst-2', name: 'Karim Mansour', email: 'karim@mansour.eg', level: 'Silver Collector member', joinDate: '2026-02-19' },
    { id: 'cst-3', name: 'Sherif El-Bialy', email: 'sherif@bialy-group.com', level: 'Elite Art Patron', joinDate: '2026-03-02' },
    { id: 'cst-4', name: 'Nour El-Sherif', email: 'nour_sherif@outlook.com', level: 'Silver Collector member', joinDate: '2026-04-22' },
];

/** Weekly revenue baseline. */
const weeklyRevenue = [45, 68, 80, 52, 95, 76, 110];

export async function GET() {
    try {
        const totalProducts = fashionDatabase.length;
        const totalArts = artDatabase.length;
        const totalCatalogItems = totalProducts + totalArts;

        const totalProductRevenue = fashionDatabase.reduce((sum, p) => sum + p.price, 0);
        const totalArtRevenue = artDatabase.reduce((sum, a) => sum + a.price, 0);
        const totalRevenue = totalProductRevenue + totalArtRevenue;

        viewCount += Math.floor(Math.random() * 3);
        aiGenerationCount += Math.floor(Math.random() * 2);

        const kpis = [
            { label: 'Bespoke Sales Vol', value: `$${(totalRevenue / 1000).toFixed(1)}K`, growth: '+14.5%', icon: 'TrendingUp', color: 'text-green-400' },
            { label: 'AI Generations', value: `${aiGenerationCount.toLocaleString()} runs`, growth: '+22.3%', icon: 'Cpu', color: 'text-[#4FC3F7]' },
            { label: 'Museum Registries', value: `${totalArts} pieces`, growth: 'Stable', icon: 'LayoutGrid', color: 'text-[#C9A84C]' },
            { label: 'Catalog Items', value: `${totalCatalogItems}`, growth: `+${totalProducts} fashion, ${totalArts} art`, icon: 'Shirt', color: 'text-pink-400' },
        ];

        const currentWeekRevenue = weeklyRevenue.map((v) => v + Math.floor(Math.random() * 10 - 3));

        return NextResponse.json({
            kpis,
            products: fashionDatabase,
            arts: artDatabase,
            orders: recentOrders,
            customers,
            weeklyRevenue: currentWeekRevenue,
            totalRevenue,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Admin dashboard data error:', error);
        return NextResponse.json(
            { error: 'Failed to load admin dashboard data' },
            { status: 500 }
        );
    }
}
