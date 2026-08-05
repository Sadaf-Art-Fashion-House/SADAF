'use client';

/**
 * SADAF | Community — Pending Friend Requests Count
 *
 * Reads the number of *received* connection requests (friend/family invites
 * waiting for the current user's response) so the header badge stays in sync
 * with the community page.
 *
 * Source of truth mirrors `useCommunity`:
 *   - sessionStorage key `sadaf_community` (persisted by useCommunity)
 *   - MOCK_PENDING_REQUESTS fallback when nothing is stored yet
 *
 * Updates:
 *   - `storage` event → cross-tab sync (community page in another tab)
 *   - `sadaf:community-updated` custom event → same-tab sync, dispatched by
 *     useCommunity whenever pendingRequests change (accept / decline / invite)
 */

import { useCallback, useEffect, useState } from 'react';
import { MOCK_PENDING_REQUESTS } from '../constants/communityData';

/** Storage key used by useCommunity to persist community state. */
const STORAGE_KEY = 'sadaf_community';

/** Custom event name dispatched by useCommunity after pending requests change. */
export const COMMUNITY_UPDATED_EVENT = 'sadaf:community-updated';

interface StoredCommunity {
    pendingRequests?: Array<{ direction?: 'sent' | 'received' }>;
}

function readReceivedCount(): number {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as StoredCommunity;
            if (Array.isArray(parsed.pendingRequests)) {
                return parsed.pendingRequests.filter((request) => request.direction === 'received').length;
            }
        }
    } catch {
        // Malformed storage — fall back to mock below
    }
    return MOCK_PENDING_REQUESTS.filter((request) => request.direction === 'received').length;
}

export function usePendingFriendRequests(userId: string | null) {
    const [count, setCount] = useState(0);

    const refresh = useCallback(() => {
        // Guests have no incoming requests — the community page requires sign-in.
        if (!userId) {
            setCount(0);
            return;
        }
        setCount(readReceivedCount());
    }, [userId]);

    useEffect(() => {
        refresh();

        // Cross-tab sync: community page open in another tab
        window.addEventListener('storage', refresh);
        // Same-tab sync: dispatched by useCommunity on accept/decline/invite
        window.addEventListener(COMMUNITY_UPDATED_EVENT, refresh);

        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener(COMMUNITY_UPDATED_EVENT, refresh);
        };
    }, [refresh]);

    return count;
}
