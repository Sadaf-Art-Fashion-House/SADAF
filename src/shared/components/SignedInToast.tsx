'use client';

/**
 * SADAF | Shared — SignedInToast
 *
 * Shows the green "Welcome back" confirmation toast on the dashboard the
 * user lands on right after a successful login. The auth page redirects to
 * the role's dashboard home with `?signedIn=1`; this component reads the
 * param lazily in a mount effect (hydration-safe), keeps the toast visible
 * for a comfortable duration (no 1.5s squish on the auth page), then cleans
 * the query string so the toast does not replay on refresh or back-nav.
 *
 * Same My-Activity pattern as every other SuccessToast in the app.
 */

import { useEffect, useState } from 'react';
import SuccessToast from './SuccessToast';

/** How long the welcome toast stays before auto-dismissing. */
const TOAST_DURATION_MS = 6_000;

export default function SignedInToast() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('signedIn') !== '1') return;

        setVisible(true);
        const dismissTimer = window.setTimeout(() => setVisible(false), TOAST_DURATION_MS);

        // Drop the flag so a refresh / back-nav does not replay the toast.
        const url = new URL(window.location.href);
        url.searchParams.delete('signedIn');
        const cleanupTimer = window.setTimeout(() => {
            window.history.replaceState(null, '', url.toString());
        }, 400);

        return () => {
            window.clearTimeout(dismissTimer);
            window.clearTimeout(cleanupTimer);
        };
    }, []);

    return (
        <SuccessToast
            visible={visible}
            title="Welcome back"
            message="Login successful — welcoming you to SADAF."
            onDismiss={() => setVisible(false)}
        />
    );
}
