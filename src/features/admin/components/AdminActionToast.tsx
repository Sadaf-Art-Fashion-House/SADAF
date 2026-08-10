'use client';

import SuccessToast from '@/shared/components/SuccessToast';

/**
 * SADAF | Admin — Action Confirmation Toast
 *
 * Quick visual feedback for admin actions on the Community Overview page
 * (Accept / Decline a pending request). Green (success tone) for Accept, red
 * (error tone) for Decline and failures. Auto-dismisses after ~3.5s; the
 * caller owns the timer.
 *
 * The visual shell is the shared `SuccessToast` (same toast every feature
 * uses) — portaled to document.body because the Community Overview page sits
 * under the sticky glass header whose backdrop-blur would become the
 * containing block and misplace/clip a fixed child.
 */

export interface AdminActionToastData {
    /** Unique id — a fresh toast remounts even for identical content. */
    id: number;
    kind: 'success' | 'decline' | 'error';
    title: string;
    message: string;
}

interface AdminActionToastProps {
    toast: AdminActionToastData | null;
    onDismiss: () => void;
}

export default function AdminActionToast({ toast, onDismiss }: AdminActionToastProps) {
    // Decline is a deliberate removal, so it shares the red tone with errors
    // (the title/message still distinguish "declined" from "failed").
    return (
        <SuccessToast
            visible={!!toast}
            animationKey={toast?.id}
            title={toast?.title ?? ''}
            message={toast?.message}
            onDismiss={onDismiss}
            tone={toast?.kind === 'success' ? 'success' : 'error'}
            portal
        />
    );
}
