'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { UserRole } from '@/shared/types';
import {
    isAdminRole,
    isCompanyRole,
    isCustomerRole,
    isDesignerRole,
    isSalesPartnerRole,
} from '@/shared/types';

type RequiredRole = 'admin' | 'founder' | 'designer' | 'sales-partner' | 'company' | 'customer';

/** Client-side home for each role — mirrors the server middleware's roleHomeFor. */
function roleHomeFor(role: UserRole | undefined): string {
    if (!role) return '/auth';
    if (isAdminRole(role)) return '/dashboard/admin';
    if (role === 'founder') return '/dashboard/founder';
    if (isDesignerRole(role)) return '/dashboard/designer';
    if (isSalesPartnerRole(role)) return '/dashboard/sales-partner';
    if (isCompanyRole(role)) return '/dashboard/company';
    if (isCustomerRole(role)) return '/dashboard';
    return '/';
}

/**
 * Client-side dashboard guard.
 *
 * The middleware already enforces routes server-side using the `sadaf_role`
 * cookie, but in the sandbox that cookie is a plain client-set value — if it
 * is stale or out of sync with the actual signed-in user (localStorage), a
 * customer could land on a founder/admin dashboard. This guard re-checks the
 * signed-in user's real role after hydration and bounces mismatches to their
 * own dashboard home (the middleware cookie is re-synced by useAuth).
 */
export default function RoleDashboardGuard({
    required,
    children,
}: {
    required: RequiredRole;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            // No signed-in user — the middleware should have redirected; if it
            // didn't (stale cookie), bounce to the sign-in page.
            router.replace('/auth');
            return;
        }
        const matches =
            required === 'admin'
                ? isAdminRole(user.role)
                : required === 'founder'
                  ? user.role === 'founder'
                  : required === 'designer'
                    ? isDesignerRole(user.role)
                    : required === 'sales-partner'
                      ? isSalesPartnerRole(user.role)
                      : required === 'company'
                        ? isCompanyRole(user.role)
                        : isCustomerRole(user.role);
        if (!matches) {
            router.replace(roleHomeFor(user.role));
            return;
        }
        setReady(true);
    }, [isLoading, user, required, router]);

    if (isLoading || !ready) return null;

    return <>{children}</>;
}
