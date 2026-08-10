'use client';

/**
 * Company dashboard route group error boundary.
 * Keeps the (company) layout (Header + CompanySidebar) alive when a page
 * under /dashboard/company crashes — only the <main> content is replaced.
 */
import DashboardErrorPage from '@/shared/ui/DashboardErrorPage';

export default DashboardErrorPage;
