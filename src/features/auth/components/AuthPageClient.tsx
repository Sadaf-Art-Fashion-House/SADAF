'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import LoginView from './LoginView';
import SignUpView from './SignUpView';
import type { UserRole } from '@/features/auth/types';
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

/** Where to go after a successful auth — the guarded page, or the dashboard. */
function getPostAuthDestination(): string {
    return getRedirectTarget() || '/dashboard';
}

export default function AuthPageClient({ mode }: AuthPageClientProps) {
    const router = useRouter();
    const { login, signup, signInWithGoogle, isLoading } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleLogin = useCallback(
        async (email: string, password: string) => {
            setError(null);
            setSuccess(null);
            const result = await login(email, password);
            if (result.success) {
                setSuccess('Login successful! Welcoming you to SADAF...');
                // Brief delay so the user sees the success message, then redirect
                // back to the page they originally tried to open (if any).
                setTimeout(() => {
                    router.push(getPostAuthDestination());
                }, 800);
            } else {
                setError(result.error || 'Authentication failed.');
            }
        },
        [login, router],
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
            if (!data.fullName.trim()) basicMissing.push('Full legal name');
            if (!data.email.trim()) basicMissing.push('Email coordinate');
            if (!data.password.trim()) basicMissing.push('Password');

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
                setError(`Please fill in the following required fields: ${basicMissing.join(', ')}`);
                return;
            }

            // Validate passcode for elevated roles (admin variants + founder)
            if (
                ELEVATED_ROLES.includes(data.role) &&
                data.secretPasscode !== 'Cairo99' &&
                data.secretPasscode !== 'sadaf123'
            ) {
                setError('Invalid authorization token for elevated access.');
                return;
            }

            // Validate referral code or username for family/friend signups
            if (
                REFERRAL_REQUIRED_ROLES.includes(data.role) &&
                !data.referralCode?.trim()
            ) {
                setError('A valid referral code or username is required to register as Family or Friend.');
                return;
            }

            // Validate company: at least website OR social media page
            if (
                data.role === 'company' &&
                data.applicationData &&
                !data.applicationData.website?.trim() &&
                !data.applicationData.socialMediaUrl?.trim()
            ) {
                setError('Please provide a company website OR a social media page (at least one is required for verification).');
                return;
            }

            const result = await signup(data);
            if (result.success) {
                const isApplicationRole = APPLICATION_REQUIRED_ROLES.includes(data.role);
                setSuccess(
                    isApplicationRole
                        ? `Your ${data.role} application has been submitted for review. We will contact you soon.`
                        : `Exclusive ${data.role} successfully registered. Welcome to SADAF.`,
                );
                setTimeout(() => {
                    router.push(getPostAuthDestination());
                }, 1800);
            } else {
                setError(result.error || 'Registration failed.');
            }
        },
        [signup, router],
    );

    const handleGoogleSignIn = useCallback(async () => {
        setError(null);
        setSuccess(null);
        const result = await signInWithGoogle();
        if (result.success) {
            // In sandbox mode, signInWithGoogle sets the user immediately.
            // For real OAuth with Supabase, the page navigates away to Google
            // so the code below only runs for sandbox.
            setSuccess('Google authentication successful! Welcoming you to SADAF...');
            setTimeout(() => {
                router.push(getPostAuthDestination());
            }, 800);
        } else {
            setError(result.error || 'Google Sign-In failed.');
        }
    }, [signInWithGoogle, router]);

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
        <LoginView
            onLogin={handleLogin}
            onGoogleSignIn={handleGoogleSignIn}
            isLoading={isLoading}
            error={error}
            success={success}
        />
    );
}
