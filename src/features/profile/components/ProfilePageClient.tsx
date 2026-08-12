'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import ProfileView from './ProfileView';

export default function ProfilePageClient() {
    const router = useRouter();
    const { user, logout, updateProfile } = useAuth();
    const { t } = useLanguage();

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
                        {t('profile.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        {t('common.signIn')}
                    </Link>
                </div>
            </div>
        );
    }

    return <ProfileView user={user} onLogout={handleLogout} onUpdateProfile={updateProfile} />;
}
