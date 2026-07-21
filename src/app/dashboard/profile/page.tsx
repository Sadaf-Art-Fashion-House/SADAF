import type { Metadata } from 'next';
import UserDashboardPageClient from './UserDashboardPageClient';

export const metadata: Metadata = {
    title: 'My Profile | SADAF Atelier',
    description: 'Manage your profile, orders, and wishlist.',
};

export default function ProfilePage() {
    return <UserDashboardPageClient />;
}
