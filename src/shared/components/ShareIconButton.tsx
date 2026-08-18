'use client';

/**
 * SADAF | Shared — ShareIconButton
 *
 * Compact share button for product cards / image overlays: opens the native
 * share sheet when available, otherwise copies the link and briefly shows a
 * check icon. Styled to sit over images (translucent dark circle), matching
 * the wishlist-heart overlay used on Fashion and Store cards. Each instance
 * keeps its own copied state via useShareLink.
 *
 * Takes a relative `path` (e.g. `/store/f-1`) instead of a full URL so
 * `window.location.origin` is only resolved inside the click handler —
 * client-only access that stays SSR-safe.
 */

import { Check, Share2 } from 'lucide-react';
import { useShareLink } from '@/shared/hooks/useShareLink';

interface ShareIconButtonProps {
    /** Relative path to share (e.g. the store PDP for a product). */
    path: string;
    /** Optional share title (product name) for the native sheet. */
    title?: string;
    /** Accessible label — shown on hover/title and to screen readers. */
    label: string;
    /** Extra classes for absolute positioning on the card overlay. */
    className?: string;
}

export function ShareIconButton({ path, title, label, className = '' }: ShareIconButtonProps) {
    const { copied, shareOrCopy } = useShareLink();

    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                void shareOrCopy(`${window.location.origin}${path}`, title);
            }}
            title={label}
            aria-label={label}
            className={`p-2 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white transition-all duration-300 cursor-pointer hover:text-[#4FC3F7] active:scale-95 ${className}`}
        >
            {copied ? (
                <Check size={14} className="text-emerald-400" />
            ) : (
                <Share2 size={14} />
            )}
        </button>
    );
}
