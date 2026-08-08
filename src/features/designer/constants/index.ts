/**
 * SADAF | Designer — Feature Constants
 *
 * Single source of truth for the design categories offered in the submit
 * form — the API route validates against the same list so the client and
 * server can never drift apart.
 */

import type { DesignCategory, DesignStatus } from '../types';

/** Product families a designer can submit work for. */
export const DESIGN_CATEGORIES: DesignCategory[] = [
    'Abaya',
    'Hoodie',
    'Jacket',
    'Dress',
    'Kaftan',
    'Editorial',
];

/** All valid pipeline states — used by the API to validate admin reviews. */
export const DESIGN_STATUSES: DesignStatus[] = [
    'draft',
    'under_review',
    'approved',
    'in_production',
    'rejected',
];

/** Human-readable label + chip colors per pipeline status. */
export const DESIGN_STATUS_STYLES: Record<
    DesignStatus,
    { label: string; chip: string; dot: string }
> = {
    draft: { label: 'Draft', chip: 'bg-white/10 text-slate-300 border-white/10', dot: 'bg-slate-400' },
    under_review: { label: 'Under Review', chip: 'bg-[#4FC3F7]/10 text-[#4FC3F7] border-[#4FC3F7]/30', dot: 'bg-[#4FC3F7]' },
    approved: { label: 'Approved', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    in_production: { label: 'In Production', chip: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30', dot: 'bg-[#C9A84C]' },
    rejected: { label: 'Rejected', chip: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-400' },
};
