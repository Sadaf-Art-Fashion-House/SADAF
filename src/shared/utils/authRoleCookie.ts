import type { UserRole } from '@/shared/types';

/**
 * SADAF | Auth — role cookie shared by the client and the server.
 *
 * useAuth (client) writes `sadaf_role` on every login/signup/logout so the
 * Next.js middleware can enforce /dashboard route guards server-side — the
 * middleware cannot read the sandbox user from localStorage, so the role is
 * mirrored into a cookie. This is a dev/sandbox mechanism: real auth would
 * use Supabase session cookies (HttpOnly) instead.
 */

/** Cookie name read by src/middleware.ts. */
export const AUTH_ROLE_COOKIE = 'sadaf_role';

/** Lifetime of the role cookie (1 week). */
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Mirror the logged-in user's role into the cookie (null clears it). Safe to
 * call anywhere on the client; middleware only reads the constant above.
 */
export function setAuthRoleCookie(role: UserRole | null): void {
    if (role) {
        document.cookie = `${AUTH_ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    } else {
        document.cookie = `${AUTH_ROLE_COOKIE}=; path=/; max-age=0`;
    }
}
