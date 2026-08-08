import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/shared/types';
import { isAdminRole, isCompanyRole, isCustomerRole, isDesignerRole, isSalesPartnerRole } from '@/shared/types';
import { AUTH_ROLE_COOKIE } from '@/shared/utils/authRoleCookie';

/**
 * SADAF | Middleware — server-side route guards.
 *
 * Migrates the legacy Vite RouteGuard to the Next.js server layer. The role
 * cookie (`sadaf_role`, written by useAuth on login/signup/logout) lets the
 * middleware enforce dashboard access before any page renders:
 *
 *   /dashboard/admin/*   → admin roles only (admin_*)
 *   /dashboard/founder/* → founder only
 *   /dashboard/designer/* → designer only
 *   /dashboard/sales-partner/* → sales_partner only
 *   /dashboard/company/* → company only
 *   /dashboard/*         → customer roles only (customer_*)
 *   /auth, /auth/signup  → blocked for logged-in users (redirect to their
 *                          dashboard home so the sign-in page is only for
 *                          guests); guests arriving from a guarded route get
 *                          a ?redirect=<original path> param so the auth page
 *                          returns them after login
 *
 * Static assets (/_next/*) and the API routes (/api/*) are excluded by the
 * matcher below. Unauthorized users are redirected to the sign-in page (no
 * session) or to their own dashboard home (wrong role) — never back to the
 * guarded route, so there is no redirect loop.
 */

function parseRole(raw: string | undefined): UserRole | undefined {
    if (!raw) return undefined;
    try {
        return decodeURIComponent(raw) as UserRole;
    } catch {
        return undefined;
    }
}

/** The dashboard home for a role (used when the requested route is forbidden). */
function roleHomeFor(role: UserRole): string {
    if (isAdminRole(role)) return '/dashboard/admin';
    if (role === 'founder') return '/dashboard/founder';
    if (isDesignerRole(role)) return '/dashboard/designer';
    if (isSalesPartnerRole(role)) return '/dashboard/sales-partner';
    if (isCompanyRole(role)) return '/dashboard/company';
    if (isCustomerRole(role)) return '/dashboard';
    return '/';
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const role = parseRole(request.cookies.get(AUTH_ROLE_COOKIE)?.value);

    // Already signed in → skip the sign-in / sign-up pages entirely and go
    // straight to the role's dashboard home.
    if (pathname.startsWith('/auth')) {
        if (!role) return NextResponse.next();
        const authHome = request.nextUrl.clone();
        authHome.pathname = roleHomeFor(role);
        authHome.search = '';
        return NextResponse.redirect(authHome);
    }

    let allowed = true;
    if (pathname.startsWith('/dashboard/admin')) {
        allowed = !!role && isAdminRole(role);
    } else if (pathname.startsWith('/dashboard/founder')) {
        allowed = role === 'founder';
    } else if (pathname.startsWith('/dashboard/designer')) {
        allowed = !!role && isDesignerRole(role);
    } else if (pathname.startsWith('/dashboard/sales-partner')) {
        allowed = !!role && isSalesPartnerRole(role);
    } else if (pathname.startsWith('/dashboard/company')) {
        allowed = !!role && isCompanyRole(role);
    } else if (pathname.startsWith('/dashboard')) {
        allowed = !!role && isCustomerRole(role);
    }

    if (allowed) return NextResponse.next();

    const url = request.nextUrl.clone();
    if (role) {
        // Wrong role → their own dashboard home.
        url.pathname = roleHomeFor(role);
        url.search = '';
    } else {
        // Guest → sign in first, remembering where they were headed so the
        // auth page can send them back after a successful login.
        url.pathname = '/auth';
        url.search = '';
        url.searchParams.set('redirect', pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(url);
}

export const config = {
    // Dashboard routes are role-guarded; /auth is blocked for signed-in users.
    // Static assets, /api/* and the public routes never reach this matcher.
    matcher: ['/dashboard/:path*', '/auth/:path*'],
};
