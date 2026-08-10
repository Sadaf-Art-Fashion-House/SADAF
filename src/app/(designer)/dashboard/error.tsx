'use client';

/**
 * Designer dashboard route group error boundary.
 * Keeps the (designer) layout (Header + DesignerSidebar) alive when a page
 * under /dashboard/designer crashes — only the <main> content is replaced.
 */
import DashboardErrorPage from '@/shared/ui/DashboardErrorPage';

export default DashboardErrorPage;
