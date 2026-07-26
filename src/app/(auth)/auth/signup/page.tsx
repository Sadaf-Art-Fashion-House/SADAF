import type { Metadata } from 'next';
import AuthPageClient from '@/features/auth/components/AuthPageClient';

export const metadata: Metadata = {
    title: 'Sign Up | SADAF Atelier',
    description: 'Create your exclusive SADAF heritage connection interface.',
};

export default function SignUpPage() {
    return <AuthPageClient mode="signup" />;
}
