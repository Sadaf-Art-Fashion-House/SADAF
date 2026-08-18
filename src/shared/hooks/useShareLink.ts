'use client';

/**
 * SADAF | Shared — useShareLink
 *
 * Single source of truth for "share this link" behavior across the app
 * (product cards, PDP, any shareable URL):
 *
 *   1. Web Share API when available (mobile / supported desktop) — opens the
 *      native share sheet with the optional title.
 *   2. Otherwise copies the URL to the clipboard and flips `copied` for a
 *      brief inline confirmation (check icon).
 *
 * The native sheet being dismissed by the user is not an error, so it is
 * swallowed silently; a blocked clipboard also degrades gracefully (the
 * caller keeps rendering, and ShareLinks-style network buttons remain the
 * richer fallback on the PDP).
 */

import { useCallback, useState } from 'react';

export function useShareLink() {
    const [copied, setCopied] = useState(false);

    const shareOrCopy = useCallback(async (url: string, title?: string) => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: title || url, url });
            } catch {
                // User dismissed the native share sheet — not an error, ignore.
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2_000);
        } catch {
            // Clipboard blocked (permissions / non-secure context) — ignore,
            // the URL remains visible and the PDP popover has network buttons.
        }
    }, []);

    return { copied, shareOrCopy };
}
