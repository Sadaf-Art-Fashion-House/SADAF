import type { Metadata } from 'next';
import ProfilePageClient from '@/features/profile/components/ProfilePageClient';

export const metadata: Metadata = {
    title: 'My Profile | SADAF Atelier',
    description: 'Manage your profile, orders, and wishlist.',
};

export default function ProfilePage() {
    return <ProfilePageClient />;
}
