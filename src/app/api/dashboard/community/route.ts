/**
 * SADAF | API Route — Community Overview (Admin / Founder)
 *
 * GET /api/dashboard/community — Platform-wide community KPIs, top
 * referrers, monthly referral-driven growth, pending connection requests,
 * and member role distribution. Consumed by the admin & founder
 * /dashboard/.../community pages via useCommunityOverview.
 *
 * Baselines reuse the customer community mocks (connections, pending
 * requests, referral info) and are padded with a platform-level roster so
 * the overview reads as a whole-company picture. Swap for Prisma/database
 * queries in production.
 */

import { NextResponse } from 'next/server';

/**
 * Never cache: the overview is polled every 30s and carries a timestamp.
 */
export const dynamic = 'force-dynamic';
import { MOCK_CONNECTIONS } from '@/features/community/constants/communityData';
import { getAdminPendingRequests } from './pendingStore';

// ─── Platform-level roster (pads the per-user mock into a company view) ─────
// Each referrer carries a few recent referred members with join dates spread
// across the last ~135 days so the Top Referrers period filter (All / 90d /
// 30d) is meaningful. Mona (last) has no 30-day referrals on purpose — the
// card must handle a referrer with zero members in the selected period.

const DAY_MS = 86_400_000;

const REFERRER_SEED = [
    {
        id: 'r-1', name: 'Layla Mostafa', referralCode: 'SADAF-LAYLA-7X2', referred: 24, rewards: 1840,
        recent: [
            { name: 'Hana Hassan', city: 'Giza', daysAgo: 5 },
            { name: 'Salma Karim', city: 'Cairo', daysAgo: 12 },
            { name: 'Farida Nasser', city: 'Sharjah', daysAgo: 28 },
            { name: 'Mariam Saeed', city: 'Alexandria', daysAgo: 41 },
            { name: 'Omar Khaled', city: 'Riyadh', daysAgo: 66 },
            { name: 'Dina Mostafa', city: 'Dubai', daysAgo: 98 },
        ],
    },
    {
        id: 'r-2', name: 'Omar Hassan', referralCode: 'SADAF-OMAR-3K1', referred: 17, rewards: 1290,
        recent: [
            { name: 'Zeina Adel', city: 'Doha', daysAgo: 3 },
            { name: 'Karim Samy', city: 'Cairo', daysAgo: 19 },
            { name: 'Laila Hassan', city: 'Amman', daysAgo: 33 },
            { name: 'Mostafa Tarek', city: 'Jeddah', daysAgo: 52 },
            { name: 'Nada Sherif', city: 'Sharjah', daysAgo: 75 },
            { name: 'Yara Kamal', city: 'Beirut', daysAgo: 104 },
        ],
    },
    {
        id: 'r-3', name: 'Nadia Ibrahim', referralCode: 'SADAF-NADIA-9Q4', referred: 12, rewards: 960,
        recent: [
            { name: 'Hossam El-Din', city: 'Alexandria', daysAgo: 8 },
            { name: 'Nourhan Adel', city: 'Giza', daysAgo: 24 },
            { name: 'Seif El-Din', city: 'Doha', daysAgo: 45 },
            { name: 'Adam Nour', city: 'Dubai', daysAgo: 70 },
            { name: 'Rana Magdy', city: 'Cairo', daysAgo: 88 },
            { name: 'Omar Fathi', city: 'Muscat', daysAgo: 116 },
        ],
    },
    {
        id: 'r-4', name: 'Karim Abdel-Malik', referralCode: 'SADAF-KARIM-5M8', referred: 9, rewards: 720,
        recent: [
            { name: 'Farah Khaled', city: 'Cairo', daysAgo: 14 },
            { name: 'Mariam Adel', city: 'Giza', daysAgo: 36 },
            { name: 'Youssef Amin', city: 'Riyadh', daysAgo: 58 },
            { name: 'Ghada Mostafa', city: 'Fayoum', daysAgo: 82 },
            { name: 'Hany Samir', city: 'Zagazig', daysAgo: 99 },
            { name: 'Sherine Fathy', city: 'Aswan', daysAgo: 121 },
        ],
    },
    {
        id: 'r-5', name: 'Mona El-Sayed', referralCode: 'SADAF-MONA-2W6', referred: 6, rewards: 410,
        recent: [
            { name: 'Rasha Nabil', city: 'Tanta', daysAgo: 42 },
            { name: 'Ahmed Adel', city: 'Mansoura', daysAgo: 63 },
            { name: 'Mahmoud Said', city: 'Sohag', daysAgo: 87 },
            { name: 'Aya Mostafa', city: 'Minya', daysAgo: 108 },
            { name: 'Khaled Samir', city: 'Ismailia', daysAgo: 126 },
            { name: 'Salma Nabil', city: 'Damietta', daysAgo: 134 },
        ],
    },
];

// Build the referrer list once at module load so the join dates stay stable
// across WS pushes / REST polls (relative to server start, like the pending
// store seeds).
const PLATFORM_REFERRERS = REFERRER_SEED.map((referrer) => ({
    id: referrer.id,
    name: referrer.name,
    referralCode: referrer.referralCode,
    referred: referrer.referred,
    rewards: referrer.rewards,
    recentReferrals: referrer.recent.map((member, index) => ({
        id: `${referrer.id}-recent-${index + 1}`,
        name: member.name,
        city: member.city,
        joinedAt: new Date(Date.now() - member.daysAgo * DAY_MS).toISOString(),
    })),
}));

// The pending-request list lives in the mutable pendingStore so the admin
// page can Accept / Decline (POST /api/dashboard/community/pending).

const GROWTH_BY_MONTH = [
    { month: 'Mar', members: 214, viaReferrals: 96 },
    { month: 'Apr', members: 268, viaReferrals: 121 },
    { month: 'May', members: 305, viaReferrals: 148 },
    { month: 'Jun', members: 341, viaReferrals: 176 },
    { month: 'Jul', members: 402, viaReferrals: 209 },
    { month: 'Aug', members: 458, viaReferrals: 243 },
];

const ROLE_DISTRIBUTION = [
    { role: 'Individual', count: 612 },
    { role: 'Family', count: 148 },
    { role: 'Friend', count: 203 },
    { role: 'Designer', count: 41 },
    { role: 'Company', count: 22 },
    { role: 'Sales Partner', count: 17 },
];

export async function GET() {
    try {
        const activeConnections = MOCK_CONNECTIONS.filter((connection) => connection.status === 'connected');
        const familyCount = activeConnections.filter((connection) => connection.type === 'family').length;
        const friendCount = activeConnections.filter((connection) => connection.type === 'friend').length;
        // The KPI mirrors the list below exactly (adminPendingRequests) so
        // the count drops live as requests are accepted/declined.
        const adminPendingRequests = getAdminPendingRequests();

        const totalMembers = 1043;
        const totalReferrals = PLATFORM_REFERRERS.reduce((sum, referrer) => sum + referrer.referred, 0);
        const rewardsPaid = PLATFORM_REFERRERS.reduce((sum, referrer) => sum + referrer.rewards, 0);

        return NextResponse.json({
            kpis: [
                { label: 'Community Members', value: `${totalMembers.toLocaleString()}`, growth: '+8.7%', color: 'text-[#4FC3F7]' },
                { label: 'Active Connections', value: `${activeConnections.length.toLocaleString()}`, growth: `${familyCount} family · ${friendCount} friends`, color: 'text-emerald-400' },
                { label: 'Members Via Referrals', value: `${totalReferrals.toLocaleString()}`, growth: '+14.2%', color: 'text-[#C9A84C]' },
                { label: 'Referral Rewards Paid', value: `$${rewardsPaid.toLocaleString()}`, growth: '+9.1%', color: 'text-amber-400' },
                { label: 'Pending Requests', value: `${adminPendingRequests.length}`, growth: `${adminPendingRequests.length} this week`, color: 'text-orange-400' },
                { label: 'Sales Partners', value: '17', growth: '3 new', color: 'text-pink-400' },
            ],
            topReferrers: PLATFORM_REFERRERS,
            growthByMonth: GROWTH_BY_MONTH,
            pendingRequests: adminPendingRequests,
            roleDistribution: ROLE_DISTRIBUTION,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Community overview data error:', error);
        return NextResponse.json(
            { error: 'Failed to load community overview data' },
            { status: 500 }
        );
    }
}
