/**
 * SADAF | Community Feature — Mock Data
 *
 * Simulated connections, network graph, and referral data for development
 * until the real Supabase tables are in place.
 */

import type {
    Connection,
    ConnectionRequest,
    NetworkGraph,
    ReferralInfo,
} from '../types';

// ─── Mock Connections ───────────────────────────────────────────────────────

export const MOCK_CONNECTIONS: Connection[] = [
    {
        userId: 'c-101',
        name: 'Layla Mostafa',
        role: 'customer_family',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
        type: 'family',
        status: 'connected',
        connectedSince: '2025-09-12',
        referredVia: 'Referral Code',
        purchaseCount: 7,
        totalSpent: 4250,
    },
    {
        userId: 'c-102',
        name: 'Omar Hassan',
        role: 'customer_family',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
        type: 'family',
        status: 'connected',
        connectedSince: '2025-11-03',
        referredVia: 'Username',
        purchaseCount: 3,
        totalSpent: 1890,
    },
    {
        userId: 'c-103',
        name: 'Nadia Ibrahim',
        role: 'customer_friend',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
        type: 'friend',
        status: 'connected',
        connectedSince: '2026-01-20',
        referredVia: 'Referral Code',
        purchaseCount: 2,
        totalSpent: 760,
    },
    {
        userId: 'c-104',
        name: 'Karim Abdel-Malik',
        role: 'customer_friend',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
        type: 'friend',
        status: 'connected',
        connectedSince: '2026-02-14',
        referredVia: 'Username',
        purchaseCount: 5,
        totalSpent: 3200,
    },
    {
        userId: 'c-105',
        name: 'Mona El-Sayed',
        role: 'customer_family',
        type: 'family',
        status: 'connected',
        connectedSince: '2026-03-08',
        referredVia: 'Referral Code',
        purchaseCount: 1,
        totalSpent: 450,
    },
    {
        userId: 'c-106',
        name: 'Tariq Al-Faisal',
        role: 'customer_friend',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
        type: 'friend',
        status: 'connected',
        connectedSince: '2026-04-01',
        referredVia: 'Referral Code',
        purchaseCount: 4,
        totalSpent: 2150,
    },
];

// ─── Pending Requests ───────────────────────────────────────────────────────

export const MOCK_PENDING_REQUESTS: ConnectionRequest[] = [
    {
        id: 'req-1',
        userId: 'c-201',
        name: 'Sara Kamal',
        email: 'sara.kamal@example.com',
        type: 'friend',
        direction: 'received',
        createdAt: new Date(Date.now() - 86_400_000).toISOString(),
        message: 'Hey! Would love to join SADAF as part of your network!',
    },
    {
        id: 'req-2',
        userId: 'c-202',
        name: 'Ahmed Zaki',
        email: 'ahmed.zaki@example.com',
        type: 'family',
        direction: 'received',
        createdAt: new Date(Date.now() - 172_800_000).toISOString(),
    },
    {
        id: 'req-3',
        userId: 'c-203',
        name: 'Dina Lotfy',
        email: 'dina.lotfy@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
        type: 'friend',
        direction: 'sent',
        createdAt: new Date(Date.now() - 259_200_000).toISOString(),
        message: 'I think you would love the new collection!',
    },
];

// ─── Network Graph ──────────────────────────────────────────────────────────

export const MOCK_NETWORK_GRAPH: NetworkGraph = {
    nodes: [
        { id: 'self', name: 'You', role: 'customer_individual', group: 'self', purchaseCount: 12 },
        { id: 'c-101', name: 'Layla M.', role: 'customer_family', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', group: 'family', purchaseCount: 7 },
        { id: 'c-102', name: 'Omar H.', role: 'customer_family', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', group: 'family', purchaseCount: 3 },
        { id: 'c-105', name: 'Mona E.', role: 'customer_family', group: 'family', purchaseCount: 1 },
        { id: 'c-103', name: 'Nadia I.', role: 'customer_friend', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', group: 'friend', purchaseCount: 2 },
        { id: 'c-104', name: 'Karim A.', role: 'customer_friend', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80', group: 'friend', purchaseCount: 5 },
        { id: 'c-106', name: 'Tariq A.', role: 'customer_friend', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', group: 'friend', purchaseCount: 4 },
    ],
    links: [
        { source: 'self', target: 'c-101', type: 'family', strength: 0.95 },
        { source: 'self', target: 'c-102', type: 'family', strength: 0.85 },
        { source: 'self', target: 'c-105', type: 'family', strength: 0.70 },
        { source: 'self', target: 'c-103', type: 'friend', strength: 0.65 },
        { source: 'self', target: 'c-104', type: 'friend', strength: 0.80 },
        { source: 'self', target: 'c-106', type: 'friend', strength: 0.60 },
        // Cross-connections: family members also know each other
        { source: 'c-101', target: 'c-102', type: 'family', strength: 0.75 },
        { source: 'c-101', target: 'c-105', type: 'family', strength: 0.60 },
        // Friends know each other
        { source: 'c-103', target: 'c-104', type: 'friend', strength: 0.55 },
    ],
};

// ─── Referral Info ──────────────────────────────────────────────────────────

export const MOCK_REFERRAL_INFO: ReferralInfo = {
    myCode: 'SADAF-LAYLA-7X2',
    totalReferred: 6,
    totalRewardsEarned: 480,
    referredUsers: [
        {
            id: 'c-101',
            name: 'Layla Mostafa',
            role: 'customer_family',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            joinedAt: '2025-09-12',
            hasFirstPurchase: true,
        },
        {
            id: 'c-102',
            name: 'Omar Hassan',
            role: 'customer_family',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            joinedAt: '2025-11-03',
            hasFirstPurchase: true,
        },
        {
            id: 'c-103',
            name: 'Nadia Ibrahim',
            role: 'customer_friend',
            avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
            joinedAt: '2026-01-20',
            hasFirstPurchase: true,
        },
        {
            id: 'c-104',
            name: 'Karim Abdel-Malik',
            role: 'customer_friend',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
            joinedAt: '2026-02-14',
            hasFirstPurchase: true,
        },
        {
            id: 'c-105',
            name: 'Mona El-Sayed',
            role: 'customer_family',
            joinedAt: '2026-03-08',
            hasFirstPurchase: false,
        },
        {
            id: 'c-106',
            name: 'Tariq Al-Faisal',
            role: 'customer_friend',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
            joinedAt: '2026-04-01',
            hasFirstPurchase: true,
        },
    ],
};
