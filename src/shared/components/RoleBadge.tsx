'use client';

/**
 * SADAF | Shared — RoleBadge
 *
 * The single colored role pill used across the app: text from ROLE_BADGES,
 * colors from ROLE_BADGE_COLORS, with a neutral slate fallback for any role
 * string that has no mapping (e.g. legacy or future roles).
 *
 * Accepts a plain `string` so community/leaderboard mock data (whose roles
 * are typed as strings) can use it directly without casts.
 */

import { ROLE_BADGES, ROLE_BADGE_COLORS } from '@/features/auth/types';

interface RoleBadgeProps {
    /** Role string (e.g. "customer_individual", "designer", "founder"). */
    role: string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-wider border font-semibold whitespace-nowrap ${
                (ROLE_BADGE_COLORS as Record<string, string>)[role] ||
                'bg-slate-500/10 text-slate-400 border-slate-500/30'
            }`}
        >
            {(ROLE_BADGES as Record<string, string>)[role] || role}
        </span>
    );
}
