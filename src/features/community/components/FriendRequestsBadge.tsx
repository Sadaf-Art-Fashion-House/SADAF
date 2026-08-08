'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isCustomerRole } from '@/shared/types';
import type { ConnectionRequest } from '../types';
import {
    usePendingFriendRequests,
    acceptRequestInStorage,
    declineRequestInStorage,
    COMMUNITY_UPDATED_EVENT,
} from '../hooks/usePendingFriendRequests';
import FriendRequestToast from './FriendRequestToast';
import { ROUTES } from '@/config/routes';

/**
 * Header friend-requests badge — shows the number of incoming connection
 * requests (friend/family invitations awaiting a response) next to the
 * notification bell. Links to the community page (/dashboard/community).
 *
 * The count updates in real time over the WebSocket channel
 * `notifications:user:{id}` (WS-primary with a REST polling fallback) and
 * stays in sync with the community page via sessionStorage + the
 * `sadaf:community-updated` custom event (see usePendingFriendRequests).
 * A tiny green dot marks the live connection. When a new request arrives
 * the icon does a quick scale pulse + ring ping (alongside the toast).
 *
 * Role gating: family & friends networking only exists for the customer
 * family of roles (individual / family / friend). Designers, companies,
 * sales partners, admins, and the founder do not take part in it, and
 * guests have no account — so the badge is hidden entirely for all of them.
 */
export default function FriendRequestsBadge() {
    const { user } = useAuth();
    // Only customers take part in family & friends networking — non-customer
    // roles never see the badge, so don't open a WS connection or subscribe
    // them to friend-request pushes. The hook still runs unconditionally
    // (rules of hooks); a null userId makes connectWS/polling early-return.
    const userId = user && isCustomerRole(user.role) ? user.id : null;
    // Hooks must run unconditionally — count is simply 0 for null userId.
    const { count, wsLive, latestArrival } = usePendingFriendRequests(userId);

    // Incoming-request toast — shows the sender + quick Accept / Decline.
    const [activeToast, setActiveToast] = useState<ConnectionRequest | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Incremented on every arrival — keyed off the icon so motion replays the
    // pulse animation for each new request (not just the first).
    const [pulseKey, setPulseKey] = useState(0);
    // The ring ping is unmounted after its animation via AnimatePresence.
    const [ringActive, setRingActive] = useState(false);
    // The pulse is purely decorative (the toast carries the content) — skip it
    // for users who prefer reduced motion.
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (!latestArrival) return;
        setActiveToast(latestArrival);
        setPulseKey((key) => key + 1);
        setRingActive(true);
        toastTimerRef.current = setTimeout(() => setActiveToast(null), 8_000);
        return () => clearTimeout(toastTimerRef.current ?? undefined);
    }, [latestArrival]);

    // Dismiss + clear the pending auto-dismiss timer (a late timer firing
    // could otherwise null a newer toast's state).
    const dismissToast = useCallback(() => {
        clearTimeout(toastTimerRef.current ?? undefined);
        setActiveToast(null);
    }, []);

    // Quick actions resolve the request straight from storage (same effect as
    // Accept / Decline on the community page), then notify every surface once.
    const handleQuickAccept = useCallback((request: ConnectionRequest) => {
        acceptRequestInStorage(request);
        window.dispatchEvent(new Event(COMMUNITY_UPDATED_EVENT));
        dismissToast();
    }, [dismissToast]);

    const handleQuickDecline = useCallback((requestId: string) => {
        declineRequestInStorage(requestId);
        window.dispatchEvent(new Event(COMMUNITY_UPDATED_EVENT));
        dismissToast();
    }, [dismissToast]);

    // Customers only (individual / family / friend). Everything else —
    // designer, company, sales_partner, admin_*, founder, guests — hides.
    if (!user || !isCustomerRole(user.role)) return null;

    return (
        <>
            <Link
                href={ROUTES.DASHBOARD_COMMUNITY}
                className="p-2 text-slate-300 hover:text-[#4FC3F7] relative transition-colors duration-300"
                title={count > 0 ? `${count} pending friend request${count === 1 ? '' : 's'}${wsLive ? ' (live)' : ''}` : wsLive ? 'My Network — live' : 'My Network'}
                aria-label={count > 0 ? `Friend requests (${count} pending)` : 'My Network'}
            >
                {/* Icon with arrival pulse — keyed so every new request replays
                    the scale bounce (the ring ping is a sibling, below). */}
                <motion.span
                    key={pulseKey}
                    initial={{ scale: 1 }}
                    animate={!reduceMotion && pulseKey > 0 ? { scale: [1, 1.45, 1] } : { scale: 1 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="inline-flex"
                >
                    <UserPlus size={16} />
                </motion.span>
                {/* Ring ping — expanding + fading halo on arrival; unmounts after
                    its animation so it never lingers in the DOM. */}
                <AnimatePresence>
                    {ringActive && !reduceMotion && (
                        <motion.span
                            key={pulseKey}
                            initial={{ opacity: 0.7, scale: 0.9 }}
                            animate={{ opacity: 0, scale: 2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            onAnimationComplete={() => setRingActive(false)}
                            className="absolute inset-0 rounded-full border border-[#4FC3F7] pointer-events-none"
                        />
                    )}
                </AnimatePresence>
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#4FC3F7] text-[#0A0F2C] font-mono text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0A0F2C] animate-pulse">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
                {/* Live indicator — WebSocket connected, the count updates in real time */}
                {wsLive && (
                    <span
                        className="absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full bg-green-400 border border-[#0A0F2C]"
                        title="Live — friend requests update in real time"
                    />
                )}
            </Link>

            {/* Incoming request toast — rendered globally from the header */}
            <FriendRequestToast
                request={activeToast}
                onAccept={handleQuickAccept}
                onDecline={handleQuickDecline}
                onDismiss={dismissToast}
            />
        </>
    );
}
