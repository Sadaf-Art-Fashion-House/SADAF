import type { Metadata } from 'next';
import AdminDashboardPageClient from './AdminDashboardPageClient';

export const metadata: Metadata = {
    title: 'Admin Dashboard | SADAF Atelier',
    description: 'Platform administration — products, orders, customers, and AI moderation.',
};

export default function AdminPage() {
    return <AdminDashboardPageClient />;
}
