'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';

const DEFAULT_ELLIPSIS = '…';

interface SmartClampProps {
    /** Full text to display. Truncated at word boundaries when it overflows its box. */
    text: string;
    /** Maximum number of visible lines. 1 behaves like CSS `truncate`, 2+ like `line-clamp-N`. */
    maxLines?: number;
    /** Semantic tag to render (defaults to <p>). Keep the original heading/paragraph tag. */
    as?: ElementType;
    /** Styling classes. Do NOT include `truncate` or `line-clamp-*` — SmartClamp manages them. */
    className?: string;
    /** Suffix appended when truncated (defaults to '…'). */
    ellipsis?: string;
    /** Expose the full text as a `title` tooltip on hover (defaults to true). */
    withTitle?: boolean;
}

/**
 * Splits on any whitespace so Arabic and Latin words are never cut mid-word —
 * CSS `truncate`/`line-clamp` cut at the character level, which slices Arabic
 * words in half. SmartClamp measures the real rendered text and only ever cuts
 * between words, appending the ellipsis after the last whole word that fits.
 */
function splitWords(text: string): string[] {
    return text.split(/\s+/).filter(Boolean);
}

export function SmartClamp({
    text,
    maxLines = 1,
    as = 'p',
    className,
    ellipsis = DEFAULT_ELLIPSIS,
    withTitle = true,
}: SmartClampProps) {
    const ref = useRef<HTMLElement | null>(null);
    const [displayText, setDisplayText] = useState(text);
    const Tag = as as ElementType;

    const measure = useCallback(() => {
        const element = ref.current;
        if (!element) return;

        const styles = window.getComputedStyle(element);
        const lineHeight = parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.5;
        const maxHeight = lineHeight * maxLines;

        // Remember inline styles so we can restore them after measuring.
        const previousOverflow = element.style.overflow;
        const previousWhiteSpace = element.style.whiteSpace;
        const previousHeight = element.style.height;

        // Lay out the FULL text inside a constrained box, then measure the overflow.
        element.textContent = text;
        element.style.overflow = 'hidden';
        element.style.whiteSpace = maxLines === 1 ? 'nowrap' : 'normal';
        if (maxLines > 1) {
            element.style.height = `${maxHeight}px`;
        }

        const overflows =
            maxLines === 1
                ? element.scrollWidth > element.clientWidth + 1
                : element.scrollHeight > maxHeight + 1;

        let clamped = text;
        if (overflows) {
            const words = splitWords(text);
            // Binary search the longest whole-word prefix that still fits.
            let low = 1;
            let high = words.length;
            let best = 1;
            while (low <= high) {
                const mid = (low + high) >> 1;
                element.textContent = `${words.slice(0, mid).join(' ')}${ellipsis}`;
                const fits =
                    maxLines === 1
                        ? element.scrollWidth <= element.clientWidth + 1
                        : element.scrollHeight <= maxHeight + 1;
                if (fits) {
                    best = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            clamped = `${words.slice(0, best).join(' ')}${ellipsis}`;
        }

        // Restore the element to its styled state; React owns the text from here.
        element.style.overflow = previousOverflow;
        element.style.whiteSpace = previousWhiteSpace;
        element.style.height = previousHeight;

        setDisplayText(clamped);
        // Keep the DOM and React in sync even when the new clamped text happens
        // to equal the previously rendered text (React would skip the update).
        if (element.textContent !== clamped) {
            element.textContent = clamped;
        }
    }, [text, maxLines, ellipsis]);

    useLayoutEffect(() => {
        measure();
    }, [measure]);

    // Re-measure when the containing card changes width (breakpoints, sidebars).
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const target = element.parentElement ?? element;
        const observer = new ResizeObserver(() => measure());
        observer.observe(target);
        return () => observer.disconnect();
    }, [measure]);

    return (
        <Tag ref={ref} className={className} title={withTitle ? text : undefined}>
            {displayText}
        </Tag>
    );
}
