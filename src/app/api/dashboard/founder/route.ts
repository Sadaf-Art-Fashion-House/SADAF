/**
 * SADAF | API Route — Founder Dashboard Data
 *
 * GET /api/dashboard/founder — Returns KPIs, transactions, team, revenue chart.
 */

import { NextResponse } from 'next/server';
import { fashionDatabase, artDatabase } from '@/data';

let cashFlow = 148500 + Math.floor(Math.random() * 500);

const teamMembers = [
    { id: 'tm-1', name: 'Yasmine Sadaf', role: 'Founder & Art Director', specialty: 'Haute Imperial Couture', status: 'In-Atelier' as const, location: 'Zamalik Quarters, Cairo' },
    { id: 'tm-2', name: 'Master Ahmed El-Saeed', role: 'Senior Calligrapher', specialty: 'Liquid Golden Diwani', status: 'In-Atelier' as const, location: 'El-Hussein Workshop' },
    { id: 'tm-3', name: 'Dr. Farida Hammad', role: 'Auteur Painter', specialty: 'Sacred Nile Oils', status: 'Online' as const, location: 'Alexandria Seafront' },
    { id: 'tm-4', name: 'Amir El-Farid', role: 'Lead Atelier Administrator', specialty: 'Logistics & Weaving Pact', status: 'In-Atelier' as const, location: 'Giza Central Studio' },
    { id: 'tm-5', name: 'SADAF AI Core Dev', role: 'Generative Tech Director', specialty: 'Gemini Embroidery Prototyping', status: 'Online' as const, location: 'Global Silicon Sandbox' },
];

const transactions = [
    { ref: 'TXN-9021-X', client: 'Layla Al-Khouri', value: '$1,250', type: 'Haute Abaya Purchase', details: 'Cairo central credit card auth' },
    { ref: 'TXN-4512-B', client: 'Layla Al-Khouri', value: '$3,400', type: 'Golden Diwani Fine Artwork', details: 'Escrow Alexandria verified' },
    { ref: 'TXN-8812-C', client: 'Karim Mansour', value: '$580', type: 'Calligraphy Streetcoach Jacket', details: 'Stripe transaction verified' },
    { ref: 'TXN-1104-Y', client: 'Dr. Farida Hammad', value: '$6,800', type: 'Nile Oil Reflections Fine Art', details: 'Collector private wire bank' },
];

export async function GET() {
    try {
        const totalFashionRevenue = fashionDatabase.reduce((sum, p) => sum + p.price, 0);
        const totalArtRevenue = artDatabase.reduce((sum, a) => sum + a.price, 0);
        const grossRevenue = totalFashionRevenue + totalArtRevenue;
        const aiShapeCount = 1492 + Math.floor(Math.random() * 5);

        cashFlow += Math.floor(Math.random() * 100);

        const kpis = [
            { label: 'GROSS COUTURE REVENUE', val: `$${(totalFashionRevenue / 1000).toFixed(1)}K`, pct: '+14% MoM', color: 'text-green-400' },
            { label: 'FINE ART SALES', val: `$${(totalArtRevenue / 1000).toFixed(1)}K`, pct: '+32% MoM', color: 'text-[#C9A84C]' },
            { label: 'AI CREATED SHAPES', val: `${aiShapeCount}`, pct: 'Active stencils', color: 'text-[#4FC3F7]' },
            { label: 'CATALOG TOTAL', val: `${fashionDatabase.length + artDatabase.length}`, pct: 'Products & Art', color: 'text-purple-400' },
        ];

        return NextResponse.json({
            kpis,
            transactions,
            team: teamMembers,
            cashFlow,
            grossRevenue,
            aiShapeCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Founder dashboard data error:', error);
        return NextResponse.json(
            { error: 'Failed to load founder dashboard data' },
            { status: 500 }
        );
    }
}
