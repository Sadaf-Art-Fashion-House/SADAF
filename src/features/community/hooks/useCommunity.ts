'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
    Connection,
    ConnectionRequest,
    NetworkGraph,
    ReferralInfo,
    ConnectionType,
} from '../types';
import {
    MOCK_CONNECTIONS,
    MOCK_PENDING_REQUESTS,
    MOCK_NETWORK_GRAPH,
    MOCK_REFERRAL_INFO,
} from '../constants/communityData';
import { COMMUNITY_UPDATED_EVENT } from './usePendingFriendRequests';

const STORAGE_KEY = 'sadaf_community';

/**
 * useCommunity — manages connections, network graph, referral info,
 * and pending requests for the customer's social network.
 *
 * Currently uses mock data; swap with Supabase queries when ready.
 */
export function useCommunity() {
    const [connections, setConnections] = useState<Connection[]>(MOCK_CONNECTIONS);
    const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>(MOCK_PENDING_REQUESTS);
    const [networkGraph] = useState<NetworkGraph>(MOCK_NETWORK_GRAPH);
    const [referralInfo, setReferralInfo] = useState<ReferralInfo>(MOCK_REFERRAL_INFO);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<ConnectionType | 'all'>('all');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Persist connection state to sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.connections) setConnections(parsed.connections);
                if (parsed.pendingRequests) setPendingRequests(parsed.pendingRequests);
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        try {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ connections, pendingRequests }),
            );
            // Notify the header friend-requests badge (same tab) that the
            // pending requests changed (accept / decline / new invite), so it
            // re-reads the count without a refresh.
            window.dispatchEvent(new Event(COMMUNITY_UPDATED_EVENT));
        } catch {
            // ignore
        }
    }, [connections, pendingRequests]);

    // ── Filtered connections ──────────────────────────────────────────────

    const filteredConnections = useMemo(() => {
        let result = connections;

        if (filterType !== 'all') {
            result = result.filter((c) => c.type === filterType);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.role.toLowerCase().includes(q),
            );
        }

        return result;
    }, [connections, filterType, searchQuery]);

    // ── Aggregate stats ───────────────────────────────────────────────────

    const stats = useMemo(() => {
        const activeConnections = connections.filter((c) => c.status === 'connected');
        const familyCount = activeConnections.filter((c) => c.type === 'family').length;
        const friendCount = activeConnections.filter((c) => c.type === 'friend').length;
        const totalSpentByNetwork = activeConnections.reduce(
            (sum, c) => sum + (c.totalSpent ?? 0),
            0,
        );
        const pendingReceived = pendingRequests.filter((r) => r.direction === 'received').length;

        return {
            totalConnections: activeConnections.length,
            familyCount,
            friendCount,
            totalSpentByNetwork,
            pendingReceived,
            sentRequests: pendingRequests.filter((r) => r.direction === 'sent').length,
        };
    }, [connections, pendingRequests]);

    // ── Handlers ──────────────────────────────────────────────────────────

    /**
     * Accept a pending connection request.
     * Searches the current pendingRequests state (not the static mock array)
     * so that dynamically created requests (via sendInvite) can also be accepted.
     * Maps ConnectionType to the correct UserRole suffix.
     */
    const acceptRequest = useCallback((requestId: string) => {
        let found: ConnectionRequest | undefined;
        setPendingRequests((prev) => {
            found = prev.find((r) => r.id === requestId);
            return prev.filter((r) => r.id !== requestId);
        });
        // Synchronous after state update — React batches set* calls,
        // so found will be set by the time setConnections runs.
        setConnections((prev) => {
            if (!found) return prev;
            const newConn: Connection = {
                userId: found.userId,
                name: found.name,
                role: found.type === 'family' ? 'customer_family' : 'customer_friend',
                avatarUrl: found.avatarUrl,
                type: found.type,
                status: 'connected',
                connectedSince: new Date().toISOString(),
            };
            return [newConn, ...prev];
        });
    }, []);

    const declineRequest = useCallback((requestId: string) => {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    }, []);

    const removeConnection = useCallback((userId: string) => {
        setConnections((prev) => prev.filter((c) => c.userId !== userId));
    }, []);

    const sendInvite = useCallback((email: string, name: string, type: ConnectionType, message?: string) => {
        const newRequest: ConnectionRequest = {
            id: `req-sent-${Date.now()}`,
            userId: `new-${Date.now()}`,
            name,
            email,
            type,
            direction: 'sent',
            createdAt: new Date().toISOString(),
            message,
        };
        setPendingRequests((prev) => [newRequest, ...prev]);
    }, []);

    const copyReferralCode = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(referralInfo.myCode);
            return true;
        } catch {
            return false;
        }
    }, [referralInfo.myCode]);

    return {
        connections: filteredConnections,
        allConnections: connections,
        pendingRequests,
        networkGraph,
        referralInfo,
        stats,
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        isInviteModalOpen,
        setIsInviteModalOpen,
        acceptRequest,
        declineRequest,
        removeConnection,
        sendInvite,
        copyReferralCode,
    };
}
