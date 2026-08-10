'use client';

/**
 * SADAF | Company — Home Page Client
 *
 * Thin client wrapper for the company workspace landing hub: hosts the shared
 * SignedInToast (reads ?signedIn=1 set by the auth page after login). The rest
 * of the landing content stays a plain server-rendered page (see page.tsx).
 */

import SignedInToast from '@/shared/components/SignedInToast';

export default function CompanyHomePageClient() {
    return <SignedInToast />;
}
