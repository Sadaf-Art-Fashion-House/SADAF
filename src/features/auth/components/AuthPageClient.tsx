'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import SuccessToast from '@/shared/components/SuccessToast';
import LoginView from './LoginView';
import SignUpView from './SignUpView';
import type { UserRole } from '@/features/auth/types';
import { isAdminRole, isDesignerRole, isSalesPartnerRole, isCompanyRole, isCustomerRole } from '@/shared/types';
import {
    ELEVATED_ROLES,
    REFERRAL_REQUIRED_ROLES,
    APPLICATION_REQUIRED_ROLES,
    APPLICATION_FIELDS,
} from '@/features/auth/types';

interface AuthPageClientProps {
    mode: 'login' | 'signup';
}

/**
 * Read the middleware's ?redirect= param (the guarded page the guest was
 * trying to open) and validate it is a safe same-origin path — blocks
 * external and protocol-relative URLs. Read lazily inside handlers, so no
 * render-time window access.
 */
function getRedirectTarget(): string | null {
    const raw = new URLSearchParams(window.location.search).get('redirect');
    if (!raw) return null;
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
    return raw;
}

/** The dashboard home for a role (mirrors the middleware's roleHomeFor). */
function dashboardHomeFor(role: UserRole): string {
    if (isAdminRole(role)) return '/dashboard/admin';
    if (role === 'founder') return '/dashboard/founder';
    if (isDesignerRole(role)) return '/dashboard/designer';
    if (isSalesPartnerRole(role)) return '/dashboard/sales-partner';
    if (isCompanyRole(role)) return '/dashboard/company';
    if (isCustomerRole(role)) return '/dashboard';
    return '/dashboard';
}

/**
 * Where to go after a successful auth — the guarded page, or the role's
 * dashboard home. Appends `?signedIn=1` so the landing dashboard shows the
 * green "Welcome back" toast (see SignedInToast).
 */
function getPostAuthDestination(role: UserRole): string {
    const target = getRedirectTarget() || dashboardHomeFor(role);
    const sep = target.includes('?') ? '&' : '?';
    return `${target}${sep}signedIn=1`;
}

export default function AuthPageClient({ mode }: AuthPageClientProps) {
    const router = useRouter();
    const { login, signup, signInWithGoogle, isLoading } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [signedOutToast, setSignedOutToast] = useState(false);
    const { t } = useLanguage();

    // Show a green confirmation toast when the user arrives here right after
    // signing out (SignOutButton pushes /auth?signedOut=1). Read lazily in a
    // mount effect — no render-time window access (hydration safety).
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('signedOut') !== '1') return;
        setSignedOutToast(true);
        const timer = window.setTimeout(() => setSignedOutToast(false), 6000);
        return () => window.clearTimeout(timer);
    }, []);

    const handleLogin = useCallback(
        async (email: string, password: string) => {
            setError(null);
            setSuccess(null);
            const result = await login(email, password);
            if (result.success) {
                // The green "Welcome back" toast now shows on the landing
                // dashboard (SignedInToast reads ?signedIn=1) — so it stays
                // visible for its full duration instead of a 1.5s squish here.
                router.push(getPostAuthDestination(result.role ?? 'customer_individual'));
            } else {
                setError(result.error || t('auth.authFailed'));
            }
        },
        [login, router, t],
    );

    const handleSignUp = useCallback(
        async (data: {
            fullName: string;
            email: string;
            password: string;
            role: UserRole;
            secretPasscode: string;
            referralCode?: string;
            applicationData?: Record<string, string>;
        }) => {
            setError(null);
            setSuccess(null);

            // ── Validate basic fields ──
            const basicMissing: string[] = [];
            if (!data.fullName.trim()) basicMissing.push(t('auth.fullLegalName'));
            if (!data.email.trim()) basicMissing.push(t('auth.emailLabel'));
            if (!data.password.trim()) basicMissing.push(t('auth.passwordField'));

            // ── Validate application required fields ──
            if (APPLICATION_REQUIRED_ROLES.includes(data.role) && data.applicationData) {
                const fields = APPLICATION_FIELDS[data.role] || [];
                for (const f of fields) {
                    if (f.required && !(data.applicationData[f.key] || '').trim()) {
                        basicMissing.push(f.label);
                    }
                }
            }

            if (basicMissing.length > 0) {
                setError(t('auth.requiredFields', { fields: basicMissing.join(', ') }));
                return;
            }

            // Validate passcode for elevated roles (admin variants + founder)
            if (
                ELEVATED_ROLES.includes(data.role) &&
                data.secretPasscode !== 'Cairo99' &&
                data.secretPasscode !== 'sadaf123'
            ) {
                setError(t('auth.invalidPasscode'));
                return;
            }

            // Validate referral code or username for family/friend signups
            if (
                REFERRAL_REQUIRED_ROLES.includes(data.role) &&
                !data.referralCode?.trim()
            ) {
                setError(t('auth.referralRequiredError'));
                return;
            }

            // Validate company: at least website OR social media page
            if (
                data.role === 'company' &&
                data.applicationData &&
                !data.applicationData.website?.trim() &&
                !data.applicationData.socialMediaUrl?.trim()
            ) {
                setError(t('auth.companyVerificationError'));
                return;
            }

            const result = await signup(data);
            if (result.success) {
                const isApplicationRole = APPLICATION_REQUIRED_ROLES.includes(data.role);
                setSuccess(
                    isApplicationRole
                        ? t('auth.applicationSubmitted', { role: data.role })
                        : t('auth.registeredWelcome', { role: data.role }),
                );
                setTimeout(() => {
                    router.push(getPostAuthDestination(data.role));
                }, 1800);
            } else {
                setError(result.error || t('auth.registrationFailed'));
            }
        },
        [signup, router, t],
    );

    const handleGoogleSignIn = useCallback(async () => {
        setError(null);
        setSuccess(null);
        const result = await signInWithGoogle();
        if (result.success) {
            // In sandbox mode, signInWithGoogle sets the user immediately.
            // For real OAuth with Supabase, the page navigates away to Google
            // so the code below only runs for sandbox. The "Welcome back"
            // toast shows on the landing dashboard via ?signedIn=1.
            router.push(getPostAuthDestination(result.role ?? 'customer_individual'));
        } else {
            setError(result.error || t('auth.googleFailed'));
        }
    }, [signInWithGoogle, router, t]);

    if (mode === 'signup') {
        return (
            <SignUpView
                onSignUp={handleSignUp}
                isLoading={isLoading}
                error={error}
                success={success}
            />
        );
    }

    return (
        <>
            {/* Green confirmation toast — My Activity pattern (fixed top-right,
                auto-dismiss + manual dismiss). Sign-out shows on arrival with
                ?signedOut=1. The login toast moved to the landing dashboard
                (SignedInToast reads ?signedIn=1) so it stays visible longer. */}
            <SuccessToast
                visible={signedOutToast}
                title={t('common.signedOut')}
                message={t('common.signedOutMessage')}
                onDismiss={() => setSignedOutToast(false)}
            />
            <LoginView
                onLogin={handleLogin}
                onGoogleSignIn={handleGoogleSignIn}
                isLoading={isLoading}
                error={error}
                success={success}
            />
        </>
    );
}
