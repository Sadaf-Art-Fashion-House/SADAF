'use client';

/**
 * SADAF | Connections — Page Client
 *
 * Auth gate (company/designer only — enforced server-side by middleware too)
 * plus the data hook and the send/respond handlers. The company identity
 * (id, name, city, focus) is read from the signed-in user so the request
 * records who sent it — the view stays purely presentational.
 *
 * Used by /dashboard/company/connections (role="company") and
 * /dashboard/designer/connections (role="designer").
 */

import { useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useConnections } from '../hooks/useConnections';
import ConnectionsView, { type ConnectionsRole } from './ConnectionsView';
import type { ConnectionResponse, NewConnectionRequest } from '../types';
import { ROUTES } from '@/config/routes';

interface ConnectionsPageClientProps {
    role: ConnectionsRole;
}

export default function ConnectionsPageClient({ role }: ConnectionsPageClientProps) {
    const { user } = useAuth();
    const { data, loading, error, wsLive, refetch, sendRequest, respond, mutating } =
        useConnections();

    // Hooks rules: all hooks called unconditionally, BEFORE any early return. ✅
    const handleSend = useCallback(
        async (designerId: string, message: string): Promise<{ ok: boolean; error?: string }> => {
            if (!user) return { ok: false, error: 'You need to sign in to send a request.' };

            const input: NewConnectionRequest = {
                companyId: user.id,
                companyName: user.fullName || 'Company',
                companyCity: user.city || 'Cairo',
                companyFocus: user.focus || 'Fashion & Art House',
                designerId,
                message,
            };
            return sendRequest(input);
        },
        [user, sendRequest],
    );

    const handleRespond = useCallback(
        (id: string, response: ConnectionResponse) => respond(id, response),
        [respond],
    );

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to access the connections hub.
                    </p>
                    <Link
                        href={ROUTES.AUTH}
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#A78BFA] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <ConnectionsView
            role={role}
            userId={user.id}
            data={data}
            loading={loading}
            error={error}
            wsLive={wsLive}
            mutating={mutating}
            onSend={handleSend}
            onRespond={handleRespond}
            onRetry={refetch}
        />
    );
}
