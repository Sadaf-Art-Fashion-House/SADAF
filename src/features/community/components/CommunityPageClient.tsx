'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { useCommunity } from '../hooks/useCommunity';
import CommunityView from './CommunityView';

export default function CommunityPageClient() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const community = useCommunity();
    const searchParams = useSearchParams();
    const { setIsInviteModalOpen } = community;
    const inviteParam = searchParams.get('invite');

    // Deep-link: the dashboard/profile "Invite Connections" buttons land here
    // with ?invite=1, which auto-opens the invite modal — same pattern as
    // fashion?category=. The setter is stable, so the effect runs only when the
    // param changes (it will NOT re-open the modal after the user closes it).
    useEffect(() => {
        if (inviteParam === '1') {
            setIsInviteModalOpen(true);
        }
    }, [inviteParam, setIsInviteModalOpen]);

    // User is not logged in — show sign-in prompt
    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('community.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        {t('community.signIn')}
                    </Link>
                </div>
            </div>
        );
    }

    return <CommunityView {...community} />;
}
