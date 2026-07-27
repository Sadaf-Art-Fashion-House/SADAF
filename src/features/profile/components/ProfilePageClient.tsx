'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ProfileView from './ProfileView';

export default function ProfilePageClient() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/auth');
    };

    // User is not logged in — show sign-in prompt
    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to view your profile.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return <ProfileView user={user} onLogout={handleLogout} />;
}
