'use client';

/**
 * Customer dashboard route group error boundary.
 * Keeps the (customer) layout (Header + CustomerSidebar) alive when a page
 * under /dashboard crashes — only the <main> content is replaced.
 */
import DashboardErrorPage from '@/shared/ui/DashboardErrorPage';

export default DashboardErrorPage;
