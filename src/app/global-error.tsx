'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { logError } from '@/features/error-logging';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * global-error — the last-resort error boundary in Next.js App Router.
 *
 * It wraps the ROOT layout itself: if the root layout crashes, neither
 * `error.tsx` nor `not-found.tsx` can render, so Next.js falls back to this
 * file. It must define its own <html> and <body> because the layout that
 * normally provides them failed.
 *
 * Errors are reported through the shared logging system so they appear in
 * the Admin/Founder Error Logs dashboards. The visual fallback is the shared
 * `ErrorFallback` component — raw error details are hidden behind a toggle
 * and end users never see them (only the developer/admin who expands the
 * toggle does).
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error('[GlobalError]', error);
        logError(error).catch(() => {
            // Logging must never crash the fallback page.
        });
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-[#0A0F2C] antialiased">
                <ErrorFallback
                    error={error}
                    onReset={reset}
                    subtitle="APP ERROR"
                    title="THE LOOM STALLED"
                    description="A critical error prevented the app shell from loading. Try again, or return in a moment."
                    size="screen"
                />
            </body>
        </html>
    );
}
