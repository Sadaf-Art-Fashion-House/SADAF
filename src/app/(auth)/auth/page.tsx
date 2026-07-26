import type { Metadata } from 'next';
import AuthPageClient from '@/features/auth/components/AuthPageClient';

export const metadata: Metadata = {
    title: 'Sign In | SADAF Atelier',
    description: 'Access your SADAF luxury boutique and virtual museum account.',
};

export default function AuthPage() {
    return <AuthPageClient mode="login" />;
}
