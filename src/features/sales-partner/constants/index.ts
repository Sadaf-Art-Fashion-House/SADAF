/**
 * SADAF | Sales Partner — Feature Constants
 *
 * The commission rate lives here so the API math and any future UI
 * disclosure (e.g. \"8% per converted referral\") share one source of truth.
 */

import type { ReferralStatus } from '../types';

/** Percentage of a converted order value earned as commission. */
export const COMMISSION_RATE = 0.08;

/** Human-readable label + chip colors per referral status. */
export const REFERRAL_STATUS_STYLES: Record<
    ReferralStatus,
    { label: string; chip: string; dot: string }
> = {
    pending: { label: 'Pending', chip: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
    converted: { label: 'Converted', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
};
