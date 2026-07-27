/**
 * Centralized route configuration for SADAF.
 *
 * Single source of truth — import from here instead of hardcoding
 * paths in components, so renaming a route updates everywhere.
 */

// ─── Public routes ──────────────────────────────────────────────────────────

export const ROUTES = {
    HOME: '/',
    ARTWORKS: '/artworks',
    FASHION: '/fashion',
    STORE: '/store',
    GALLERY: '/gallery',
    AI_STUDIO: '/ai',
    EXHIBITION: '/exhibition',
    ATELIER: '/atelier',
    CART: '/cart',
    CHECKOUT: '/checkout',
    WISHLIST: '/wishlist',

    // Auth
    AUTH: '/auth',
    SIGNUP: '/auth/signup',

    // Dashboard
    DASHBOARD: '/dashboard',
    DASHBOARD_PROFILE: '/dashboard/profile',
    DASHBOARD_ADMIN: '/dashboard/admin',
    DASHBOARD_FOUNDER: '/dashboard/founder',
    DASHBOARD_ERROR_LOGS: '/dashboard/admin/error-logs',
    DASHBOARD_FOUNDER_ERROR_LOGS: '/dashboard/founder/error-logs',
    DASHBOARD_EMAIL_SETTINGS: '/dashboard/admin/email-settings',
    DASHBOARD_FOUNDER_EMAIL_SETTINGS: '/dashboard/founder/email-settings',
} as const;

// ─── Navigation (public header) ─────────────────────────────────────────────

/**
 * Main navigation links shown directly in the header bar.
 */
export const NAV_LINKS = [
    { href: ROUTES.HOME, label: 'Home' },
    { href: ROUTES.ARTWORKS, label: 'Arts' },
    { href: ROUTES.FASHION, label: 'Fashion' },
    { href: ROUTES.STORE, label: 'Store' },
    { href: ROUTES.GALLERY, label: 'Gallery' },
    { href: ROUTES.AI_STUDIO, label: 'AI Studio' },
] as const;

/**
 * Links grouped under the "More ▼" dropdown in the header.
 */
export const DROPDOWN_LINKS = [
    { href: ROUTES.EXHIBITION, label: 'Exhibition', desc: 'Virtual 3D art gallery' },
    { href: ROUTES.ATELIER, label: 'Atelier', desc: 'Design workshop & crafts' },
] as const;
