/**
 * SADAF | API — Admin Pending Requests Store (in-memory)
 *
 * Mutable source of truth for the platform-level pending connection
 * requests shown on the admin/founder Community Overview page. The GET
 * route reads it; the POST route (resolve) mutates it, so Accept / Decline
 * from the page take effect immediately and the 10s WS push keeps every
 * client in sync.
 *
 * Seeded with varied cities + relative dates so the city/date filters are
 * meaningful during development. Swap for a Prisma/database table in
 * production (state resets on server restart, like the other demo stores).
 */

import type { PlatformPendingRequest } from '@/features/admin/types';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

const SEEDED_PENDING: PlatformPendingRequest[] = [
    { id: 'pp-1', name: 'Salma Fouad', email: 'salma.fouad@example.com', type: 'friend', invitedBy: 'Omar Hassan', city: 'Cairo', createdAt: new Date(Date.now() - 2 * HOUR_MS).toISOString() },
    { id: 'pp-2', name: 'Youssef Farouk', email: 'youssef.farouk@example.com', type: 'family', invitedBy: 'Layla Mostafa', city: 'Alexandria', createdAt: new Date(Date.now() - 5 * HOUR_MS).toISOString() },
    { id: 'pp-3', name: 'Hana Adel', email: 'hana.adel@example.com', type: 'friend', invitedBy: 'Nadia Ibrahim', city: 'Giza', createdAt: new Date(Date.now() - 1 * DAY_MS).toISOString() },
    { id: 'pp-4', name: 'Tarek Nabil', email: 'tarek.nabil@example.com', type: 'friend', invitedBy: 'Karim Abdel-Malik', city: 'Cairo', createdAt: new Date(Date.now() - 3 * DAY_MS).toISOString() },
    { id: 'pp-5', name: 'Nour El-Din', email: 'nour.eldin@example.com', type: 'family', invitedBy: 'Mona El-Sayed', city: 'Luxor', createdAt: new Date(Date.now() - 6 * DAY_MS).toISOString() },
    { id: 'pp-6', name: 'Farida Tamer', email: 'farida.tamer@example.com', type: 'friend', invitedBy: 'Layla Mostafa', city: 'Sharjah', createdAt: new Date(Date.now() - 12 * DAY_MS).toISOString() },
    { id: 'pp-7', name: 'Ali Sherif', email: 'ali.sherif@example.com', type: 'family', invitedBy: 'Omar Hassan', city: 'Riyadh', createdAt: new Date(Date.now() - 25 * DAY_MS).toISOString() },
];

let pendingRequests: PlatformPendingRequest[] = SEEDED_PENDING;

/** Snapshot of the current pending requests. */
export function getAdminPendingRequests(): PlatformPendingRequest[] {
    return pendingRequests;
}

/**
 * Resolve (accept / decline) a pending request by removing it from the
 * store. Returns false when the id is unknown.
 */
export function resolveAdminPendingRequest(
    id: string,
    _action: 'accept' | 'decline',
): boolean {
    const before = pendingRequests.length;
    pendingRequests = pendingRequests.filter((request) => request.id !== id);
    return pendingRequests.length < before;
}
