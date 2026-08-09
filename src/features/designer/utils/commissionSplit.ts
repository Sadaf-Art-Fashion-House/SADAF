/**
 * SADAF | Designer — Commission Split (single source of truth)
 *
 * The collaborator list is the basis for money: when an approved design is
 * produced and sold, the atelier pays a commission pool and the team splits
 * it. The default split is equal (1/N each) — transparent by design; a
 * custom per-member split can be layered on later without changing callers.
 */

import type { DesignCollaboration, DesignCollaborator } from '../types';

/** Commission pool as a fraction of the retail price (10%). */
export const COMMISSION_POOL_RATE = 0.1;

/**
 * Every credited participant of a submission — the immutable owner first
 * (as "Design Lead"), then the named collaborators (deduped by id). The
 * owner is always part of the team, even for solo projects, so the split
 * math and the member list never drift between the designer detail page
 * and the admin atelier tab.
 */
export function participantsFor(
    collaboration: DesignCollaboration | undefined,
): DesignCollaborator[] {
    const ownerId = collaboration?.ownerId;
    const members = collaboration?.members ?? [];
    if (!ownerId) return members;

    const owner: DesignCollaborator = {
        id: ownerId,
        name: collaboration?.ownerName ?? 'Designer',
        role: 'Design Lead',
        avatarUrl: collaboration?.ownerAvatarUrl,
        // The owner is credited at submission (the moment the record exists).
        creditedAt: collaboration?.ownerCreditedAt,
    };
    return [owner, ...members.filter((m) => m.id !== ownerId)];
}

export interface CommissionShare {
    memberId: string;
    /** Share of the pool, e.g. 50. */
    percent: number;
    /** Projected payout in USD from a single unit sale. */
    amount: number;
}

/**
 * Equal split of the commission pool across the team. The last member
 * absorbs rounding so the percentages always sum to 100.
 */
export function computeCommissionSplit(
    members: DesignCollaborator[],
    price: number,
): CommissionShare[] {
    if (members.length === 0) return [];

    const pool = price * COMMISSION_POOL_RATE;
    const rawPercent = 100 / members.length;
    const rawAmount = pool / members.length;

    return members.map((member, index) => {
        const isLast = index === members.length - 1;
        const percent = isLast
            ? Math.round((100 - rawPercent * (members.length - 1)) * 10) / 10
            : Math.round(rawPercent * 10) / 10;
        const amount = isLast
            ? Math.round((pool - rawAmount * (members.length - 1)) * 100) / 100
            : Math.round(rawAmount * 100) / 100;
        return { memberId: member.id, percent, amount };
    });
}
