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

/**
 * People the designer can credit as collaborators when building the team —
 * a small catalog of atelier artisans/partners (sandbox). Adding is
 * free-form on the client but validated server-side; the avatar is optional.
 */
export const COLLABORATOR_PRESETS = [
    { id: 'usr-1', name: 'Layla M.', role: 'Creative Direction', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-2', name: 'Amir F.', role: 'Pattern Engineering', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-3', name: 'Nadia H.', role: 'Silk & Print Specialist', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-6', name: 'Dr. Farida H.', role: 'Textile Research', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-7', name: 'Nour E.', role: 'Draping Assistant', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-8', name: 'Hana Z.', role: 'Graphic & Crest Artist', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-9', name: 'Youssef B.', role: 'Embroidery Artisan', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
    { id: 'usr-10', name: 'Salma F.', role: 'Beadwork Specialist', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
] as const;
