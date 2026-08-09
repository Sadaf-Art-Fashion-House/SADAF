import type { Metadata } from 'next';
import DesignerPortfolioDetailPageClient from '@/features/designer/components/DesignerPortfolioDetailPageClient';

export const metadata: Metadata = {
    title: 'Project Details | SADAF Atelier',
    description: 'Full details of a designer portfolio project — status, atelier feedback, and collaborators.',
};

/**
 * Portfolio project detail — 3-layer pattern: this server page only renders
 * the client boundary. The submission data is fetched client-side through
 * the same WebSocket-primary hook the dashboard uses (the store is
 * in-memory on the API route, so there is nothing meaningful to fetch
 * server-side here).
 */
export default async function DesignerPortfolioDetailPage() {
    return <DesignerPortfolioDetailPageClient />;
}
