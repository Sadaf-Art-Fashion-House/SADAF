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
    SEARCH: '/search',
    REVIEWS: '/reviews',
    EXHIBITION: '/exhibition',
    ATELIER: '/atelier',
    CART: '/cart',
    CHECKOUT: '/checkout',
    WISHLIST: '/wishlist',
    ORDERS: '/orders',

    // Auth
    AUTH: '/auth',
    SIGNUP: '/auth/signup',

    // Dashboard
    DASHBOARD: '/dashboard',
    DASHBOARD_PROFILE: '/dashboard/profile',
    DASHBOARD_ORDERS: '/dashboard/orders',
    DASHBOARD_ADMIN: '/dashboard/admin',
    DASHBOARD_FOUNDER: '/dashboard/founder',
    DASHBOARD_DESIGNER: '/dashboard/designer',
    DASHBOARD_DESIGNER_CONNECTIONS: '/dashboard/designer/connections',
    DASHBOARD_DESIGNER_PORTFOLIO: '/dashboard/designer/portfolio',
    DASHBOARD_DESIGNER_COMMISSIONS: '/dashboard/designer/commissions',
    DASHBOARD_SALES_PARTNER: '/dashboard/sales-partner',
    DASHBOARD_SALES_PARTNER_COMMISSIONS: '/dashboard/sales-partner/commissions',
    DASHBOARD_COMPANY: '/dashboard/company',
    DASHBOARD_COMPANY_CONNECTIONS: '/dashboard/company/connections',
    DASHBOARD_ERROR_LOGS: '/dashboard/admin/error-logs',
    DASHBOARD_FOUNDER_ERROR_LOGS: '/dashboard/founder/error-logs',
    DASHBOARD_EMAIL_SETTINGS: '/dashboard/admin/email-settings',
    DASHBOARD_FOUNDER_EMAIL_SETTINGS: '/dashboard/founder/email-settings',
    DASHBOARD_NOTIFICATIONS: '/dashboard/notifications',
    DASHBOARD_ANALYSIS: '/dashboard/analysis',
    DASHBOARD_COMMUNITY: '/dashboard/community',
    DASHBOARD_LEADERBOARD: '/dashboard/leaderboard',
    DASHBOARD_ADMIN_LEADERBOARD: '/dashboard/admin/leaderboard',
    DASHBOARD_FOUNDER_LEADERBOARD: '/dashboard/founder/leaderboard',
    DASHBOARD_ADMIN_ANALYTICS: '/dashboard/admin/analytics',
    DASHBOARD_FOUNDER_ANALYTICS: '/dashboard/founder/analytics',
    DASHBOARD_ADMIN_COMMUNITY: '/dashboard/admin/community',
    DASHBOARD_FOUNDER_COMMUNITY: '/dashboard/founder/community',
    DASHBOARD_SETTINGS: '/dashboard/settings',
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
    { href: ROUTES.REVIEWS, label: 'Reviews', desc: 'Customer reviews & ratings' },
] as const;
