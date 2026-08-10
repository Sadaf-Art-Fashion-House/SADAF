'use client';

/**
 * Founder dashboard route group error boundary.
 * Keeps the (founder) layout (Header + FounderSidebar) alive when a page
 * under /dashboard/founder crashes — only the <main> content is replaced.
 */
import DashboardErrorPage from '@/shared/ui/DashboardErrorPage';

export default DashboardErrorPage;
