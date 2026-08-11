'use client';

import SuccessToast from '@/shared/components/SuccessToast';
import type { ReferralRecord } from '../types';

/**
 * SADAF | Sales Partner — Referral Converted Toast
 *
 * Slides in from the top-right when a pending referral converts to a paying
 * order over the WebSocket (sales-partner:global). Mirrors the leaderboard
 * overtake / friend-request toast style (My Activity pattern). Shows the
 * customer name + city with the order value and the commission just earned.
 * Auto-dismisses after 8s (timer lives in the parent, same as
 * FriendRequestToast).
 *
 * Rendered inline (no portal): unlike the header FriendRequestToast — which
 * sits inside the sticky glass header whose backdrop-blur would become the
 * containing block for a fixed child — this toast lives in the page flow,
 * so `fixed` positions against the viewport directly.
 *
 * The visual shell is the shared `SuccessToast` (same green toast every
 * feature uses); only the message content is referral-specific.
 */

interface ReferralConvertedToastProps {
    /** The converted referral to display (null hides the toast). */
    referral: ReferralRecord | null;
    /** Dismiss the toast. */
    onDismiss: () => void;
}

export default function ReferralConvertedToast({
    referral,
    onDismiss,
}: ReferralConvertedToastProps) {
    return (
        <SuccessToast
            visible={!!referral}
            animationKey={referral?.id}
            title="Referral converted!"
            onDismiss={onDismiss}
            message={
                referral && (
                    <>
                        <span className="font-medium text-emerald-400">{referral.name}</span>{' '}
                        <span className="text-[#E8E0D5]/50">({referral.city})</span> placed a
                        paying order
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-mono text-[#E8E0D5]/50">
                                Order ${referral.orderValue?.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-emerald-400">
                                +${referral.commission?.toLocaleString()} commission
                            </span>
                        </div>
                    </>
                )
            }
        />
    );
}
