'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import FounderDashboardView from '@/features/dashboard/components/FounderDashboardView';

export default function FounderDashboardPageClient() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/auth');
    };

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        You need to sign in to access the founder dashboard.
                    </p>
                    <a
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </a>
                </div>
            </div>
        );
    }

    return <FounderDashboardView user={user} onLogout={handleLogout} />;
}
