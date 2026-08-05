'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isCustomerRole } from '@/shared/types';
import { usePendingFriendRequests } from '../hooks/usePendingFriendRequests';
import { ROUTES } from '@/config/routes';

/**
 * Header friend-requests badge — shows the number of incoming connection
 * requests (friend/family invitations awaiting a response) next to the
 * notification bell. Links to the community page (/dashboard/community).
 *
 * The count stays in sync with the community page via sessionStorage +
 * the `sadaf:community-updated` custom event (see usePendingFriendRequests).
 *
 * Role gating: family & friends networking only exists for the customer
 * family of roles (individual / family / friend). Designers, companies,
 * sales partners, admins, and the founder do not take part in it, and
 * guests have no account — so the badge is hidden entirely for all of them.
 */
export default function FriendRequestsBadge() {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    // Hooks must run unconditionally — count is simply 0 for null userId.
    const count = usePendingFriendRequests(userId);

    // Customers only (individual / family / friend). Everything else —
    // designer, company, sales_partner, admin_*, founder, guests — hides.
    if (!user || !isCustomerRole(user.role)) return null;

    return (
        <Link
            href={ROUTES.DASHBOARD_COMMUNITY}
            className="p-2 text-slate-300 hover:text-[#4FC3F7] relative transition-colors duration-300"
            title={count > 0 ? `${count} pending friend request${count === 1 ? '' : 's'}` : 'My Network'}
            aria-label={count > 0 ? `Friend requests (${count} pending)` : 'My Network'}
        >
            <UserPlus size={16} />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#4FC3F7] text-[#0A0F2C] font-mono text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0A0F2C] animate-pulse">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
}
