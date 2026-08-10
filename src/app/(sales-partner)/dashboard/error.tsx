'use client';

/**
 * Sales Partner dashboard route group error boundary.
 * Keeps the (sales-partner) layout (Header + SalesPartnerSidebar) alive when
 * a page under /dashboard/sales-partner crashes — only the <main> content is
 * replaced.
 */
import DashboardErrorPage from '@/shared/ui/DashboardErrorPage';

export default DashboardErrorPage;
