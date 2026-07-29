/**
 * SADAF | API Route — Customer Dashboard Data
 *
 * GET /api/dashboard/customer — Returns customer-specific stats,
 * recent products, and arts from the catalog.
 */

import { NextResponse } from 'next/server';
import { fashionDatabase, artDatabase } from '@/data';

export async function GET() {
    try {
        const recentProducts = fashionDatabase.slice(0, 3);
        const recentArts = artDatabase.slice(0, 2);
        const totalItems = fashionDatabase.length + artDatabase.length;

        return NextResponse.json({
            stats: {
                totalProducts: fashionDatabase.length,
                totalArts: artDatabase.length,
                totalCatalogItems: totalItems,
                featuredItems: recentProducts.length + recentArts.length,
            },
            recentProducts,
            recentArts,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Customer dashboard data error:', error);
        return NextResponse.json(
            { error: 'Failed to load dashboard data' },
            { status: 500 }
        );
    }
}
