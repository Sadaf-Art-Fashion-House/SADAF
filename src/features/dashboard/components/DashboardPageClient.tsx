'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import DashboardView from './DashboardView';

export default function DashboardPageClient() {
    const router = useRouter();
    const { user, logout, updateProfile } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/auth');
    };

    // User is not logged in — redirect to login
    if (!user) {
        // We use a timeout to avoid the "Cannot update during render" error
        // that would happen if we called router.push() directly in render.
        // Using useEffect or relying on the auth state change is cleaner.
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to view your dashboard.
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

    return <DashboardView user={user} onLogout={handleLogout} onUpdateProfile={updateProfile} />;
}
