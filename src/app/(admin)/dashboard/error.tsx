'use client';

/**
 * Admin dashboard route group error boundary.
 * Keeps the (admin) layout (Header + AdminSidebar) alive when a page under
 * /dashboard/admin crashes — only the <main> content is replaced.
 */
import DashboardErrorPage from '@/shared/ui/DashboardErrorPage';

export default DashboardErrorPage;
