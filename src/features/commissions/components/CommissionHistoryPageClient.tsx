'use client';

/**
 * SADAF | Commissions — History Page Client
 *
 * Auth gate (role-specific — enforced server-side by middleware too) plus
 * the data hook. All real logic lives here; the view stays purely
 * presentational. Shared by /dashboard/designer/commissions and
 * /dashboard/sales-partner/commissions via the `kind` prop.
 */

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import { isDesignerRole, isSalesPartnerRole } from '@/shared/types';
import type { CommissionKind } from '../types';
import { useCommissionHistory } from '../hooks/useCommissionHistory';
import CommissionHistoryView from './CommissionHistoryView';

export default function CommissionHistoryPageClient({ kind }: { kind: CommissionKind }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { data, loading, error, refetch } = useCommissionHistory(kind);

    // Hooks rules: all hooks called unconditionally, BEFORE any early return. ✅

    const allowed = user
        ? kind === 'designer'
            ? isDesignerRole(user.role)
            : isSalesPartnerRole(user.role)
        : false;

    if (!allowed) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-[#E8E0D5]/60 mb-4">
                        {t('commissionHistory.needSignIn')}
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A84C] to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105"
                    >
                        {t('common.signIn')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <CommissionHistoryView
            kind={kind}
            data={data}
            loading={loading}
            error={error}
            onRetry={refetch}
        />
    );
}
