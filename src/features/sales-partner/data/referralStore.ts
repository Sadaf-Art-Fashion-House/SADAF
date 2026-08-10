/**
 * SADAF | Sales Partner — Referral Store (in-memory)
 *
 * Mutable source of truth for the partner's referrals. The overview route
 * (GET /api/dashboard/sales-partner) reads it and POST /convert mutates it;
 * the commission-history route reads the exact same state — one source of
 * truth, so a conversion shows up in both the dashboard and the ledger.
 *
 * Next.js bundles every route handler separately, so module-level state is
 * duplicated per route bundle. Hanging the store on globalThis gives all
 * route bundles one shared instance inside the same server process (the
 * same pattern as the designer store).
 *
 * Seeded with converted + pending referrals so the KPIs and the ledger are
 * meaningful during development. Swap for a Prisma/database table in
 * production (state resets on server restart, like the other demo stores).
 */

import type { ReferralRecord } from '../types';
import { COMMISSION_RATE } from '../constants';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Commission for a converted referral: rate × order value, rounded to cents. */
export function commissionFor(orderValue: number): number {
    return Math.round(orderValue * COMMISSION_RATE * 100) / 100;
}

const SEEDED_REFERRALS: ReferralRecord[] = [
    { id: 'sr-1', name: 'Mariam Khaled', city: 'Cairo', status: 'converted', joinedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(), orderValue: 2400 },
    { id: 'sr-2', name: 'Omar Nabil', city: 'Alexandria', status: 'converted', joinedAt: new Date(Date.now() - 5 * DAY_MS).toISOString(), orderValue: 1450 },
    { id: 'sr-3', name: 'Salma Tarek', city: 'Giza', status: 'pending', joinedAt: new Date(Date.now() - 1 * DAY_MS).toISOString() },
    { id: 'sr-4', name: 'Hossam Adel', city: 'Doha', status: 'converted', joinedAt: new Date(Date.now() - 20 * DAY_MS).toISOString(), orderValue: 890 },
    { id: 'sr-5', name: 'Farida Nasser', city: 'Riyadh', status: 'pending', joinedAt: new Date(Date.now() - 6 * HOUR_MS).toISOString() },
    { id: 'sr-6', name: 'Karim Samy', city: 'Sharjah', status: 'converted', joinedAt: new Date(Date.now() - 45 * DAY_MS).toISOString(), orderValue: 3200 },
];

interface ReferralStoreState {
    referrals: ReferralRecord[];
}

const globalStore = globalThis as unknown as {
    __sadafReferralStore?: ReferralStoreState;
};

const store: ReferralStoreState = (globalStore.__sadafReferralStore ??= {
    referrals: SEEDED_REFERRALS,
});

/**
 * Live referral records — shared by the overview route, the convert action
 * and the commission-history route. Mutations (converting a referral) are
 * visible everywhere because every bundle shares the same instance.
 */
export function getReferralRecords(): ReferralRecord[] {
    return store.referrals;
}
