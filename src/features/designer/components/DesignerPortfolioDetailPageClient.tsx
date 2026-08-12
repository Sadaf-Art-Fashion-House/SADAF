'use client';

/**
 * SADAF | Designer — Portfolio Detail Page Client
 *
 * Auth gate (designer only, also enforced by middleware), the same
 * WS-primary data hook as the dashboard, the route-param lookup that
 * resolves the submission id into the project shown by the view, and the
 * collaborator-management handler (add-only credits model). Missing ids get
 * an explicit not-found state — no silent failures.
 */

import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { useDesignerData } from '../hooks/useDesignerData';
import DesignerPortfolioDetailView from './DesignerPortfolioDetailView';
import type { DesignCollaborator } from '../types';

export default function DesignerPortfolioDetailPageClient() {
    const params = useParams<{ id: string }>();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { data, loading, error, refetch } = useDesignerData();
    const [addingCollaborator, setAddingCollaborator] = useState(false);

    // POSTs the new collaborator; on success the payload is refetched so the
    // member list updates immediately (the WS push then confirms it). Kept
    // above the auth/loading returns — all hooks run on every render.
    const handleAddCollaborator = useCallback(
        async (collaborator: DesignCollaborator): Promise<{ ok: boolean; error?: string }> => {
            setAddingCollaborator(true);
            try {
                const res = await fetch('/api/dashboard/designer/collaborators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: params.id,
                        ownerId: user?.id ?? '',
                        collaborator,
                    }),
                });
                if (!res.ok) {
                    const json = (await res.json().catch(() => null)) as { error?: string } | null;
                    throw new Error(json?.error ?? `HTTP ${res.status}`);
                }
                await refetch();
                return { ok: true };
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : t('designer.err.add');
                return { ok: false, error: message };
            } finally {
                setAddingCollaborator(false);
            }
        },
        [params.id, user?.id, refetch],
    );

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('designer.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#A78BFA] to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        {t('common.signIn')}
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#A78BFA]/30 border-t-[#A78BFA] rounded-full animate-spin" />
            </div>
        );
    }

    const submission = data?.submissions.find((item) => item.id === params.id) ?? null;

    // Credits model: only the immutable owner can credit new collaborators;
    // there is deliberately no remove path (removing would rewrite history).
    const isOwner =
        !!user && !!submission && submission.collaboration?.ownerId === user.id;

    return (
        <DesignerPortfolioDetailView
            submission={submission}
            error={error}
            isOwner={isOwner}
            addingCollaborator={addingCollaborator}
            onAddCollaborator={handleAddCollaborator}
        />
    );
}
