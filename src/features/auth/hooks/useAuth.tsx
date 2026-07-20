'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { supabase, isSupabaseConfigured, mockAuth } from '@/lib/supabase';
import type { UserProfile, UserRole, SignUpData } from '@/features/auth/types';
import { REFERRAL_REQUIRED_ROLES } from '@/features/auth/types';

// ─── Context value ───────────────────────────────────────────────────────────

interface AuthContextValue {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Maps legacy role names (from old Supabase metadata or old localStorage data)
 * to the new expanded role system. Defaults to customer_individual for unknown values.
 */
function mapLegacyRole(raw: string | undefined | null): UserRole {
    if (!raw) return 'customer_individual';
    const known: Record<string, UserRole> = {
        customer: 'customer_individual',
        customer_individual: 'customer_individual',
        customer_family: 'customer_family',
        customer_friend: 'customer_friend',
        designer: 'designer',
        company: 'company',
        sales_partner: 'sales_partner',
        admin: 'admin_super',
        admin_sales: 'admin_sales',
        admin_media: 'admin_media',
        admin_sales_media: 'admin_sales_media',
        admin_software: 'admin_software',
        admin_super: 'admin_super',
        founder: 'founder',
    };
    return known[raw] || 'customer_individual';
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate user from localStorage on mount (handles page refreshes).
    // Also maps any legacy role names (e.g. 'customer' → 'customer_individual')
    // so the dashboard and header always see the new role format.
    useEffect(() => {
        try {
            const current = mockAuth.getCurrentUser();
            if (current) {
                const profile = current as UserProfile;
                // Ensure the role is in the new expanded format
                const mappedRole = mapLegacyRole(profile.role);
                setUser({ ...profile, role: mappedRole });
            }
        } catch {
            // localStorage unavailable — continue as anonymous
        }
        setIsLoading(false);
    }, []);

    // ── Login ────────────────────────────────────────────────────────────────

    const login = useCallback(
        async (
            email: string,
            password: string,
        ): Promise<{ success: boolean; error?: string }> => {
            setIsLoading(true);

            // Artificial delay so the loading spinner is visible
            await new Promise((r) => setTimeout(r, 800));

            try {
                if (isSupabaseConfigured && supabase) {
                    try {
                        const { data, error: authError } =
                            await supabase.auth.signInWithPassword({ email, password });
                        if (authError) throw authError;

                        if (data.user) {
                            const rawRole = data.user.user_metadata?.role as string;
                            // Map legacy role names to the new role system
                            const role = mapLegacyRole(rawRole);
                            const fullName =
                                data.user.user_metadata?.fullName ||
                                data.user.email?.split('@')[0] ||
                                'Member';

                            const profile: UserProfile = {
                                id: data.user.id,
                                email: data.user.email || '',
                                role,
                                fullName,
                                hasDesignerAccess: !!data.user.user_metadata?.hasDesignerAccess,
                                createdAt: data.user.created_at || new Date().toISOString(),
                            };

                            setUser(profile);
                            return { success: true };
                        }
                        return { success: false, error: 'No user data returned.' };
                    } catch (supabaseErr) {
                        console.warn(
                            'Supabase login failed, falling back to sandbox:',
                            supabaseErr,
                        );
                        // Fall through to sandbox mode
                    }
                }

                // ── Sandbox mode ─────────────────────────────────────────────
                const users = mockAuth.getUsers();
                const matched = users.find(
                    (u) => u.email.toLowerCase() === email.toLowerCase(),
                );

                if (matched) {
                    const profile = matched as UserProfile;
                    mockAuth.setCurrentUser(profile);
                    setUser(profile);
                    return { success: true };
                }

                // Auto-create account for any email in sandbox
                const simulatedName =
                    email.split('@')[0].charAt(0).toUpperCase() +
                    email.split('@')[0].slice(1);
                const newProfile: UserProfile = {
                    id: `usr-${Date.now()}`,
                    email,
                    role: 'customer_individual',
                    fullName: simulatedName,
                    createdAt: new Date().toISOString(),
                };
                const updated = [...users, newProfile];
                mockAuth.saveUsers(updated);
                mockAuth.setCurrentUser(newProfile);
                setUser(newProfile);
                return { success: true };
            } catch (err: any) {
                return {
                    success: false,
                    error: err.message || 'Authentication error.',
                };
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    // ── Sign Up ──────────────────────────────────────────────────────────────

    const signup = useCallback(
        async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
            setIsLoading(true);
            await new Promise((r) => setTimeout(r, 800));

            try {
                // ── Universal validation (runs regardless of Supabase / sandbox) ──

                // Validate company: at least website OR social media page
                if (
                    data.role === 'company' &&
                    data.applicationData &&
                    !data.applicationData.website?.trim() &&
                    !data.applicationData.socialMediaUrl?.trim()
                ) {
                    return {
                        success: false,
                        error: 'Please provide a company website OR a social media page (at least one is required for verification).',
                    };
                }

                // Validate referral for family / friend signups.
                // The inviter can provide EITHER:
                //   a) their unique referral code (e.g. "SADAF-LAYLA-7X2")
                //   b) their username (email) so the system looks them up
                if (REFERRAL_REQUIRED_ROLES.includes(data.role)) {
                    const users = mockAuth.getUsers();
                    const input = (data.referralCode || '').trim().toLowerCase();

                    // Try matching by referral code first, then by email (username)
                    const referrer =
                        users.find(
                            (u) =>
                                u.referralCode?.toLowerCase() === input,
                        ) ||
                        users.find(
                            (u) =>
                                u.email.toLowerCase() === input,
                        );

                    if (!referrer) {
                        return {
                            success: false,
                            error: 'Invalid referral code or username. Please check with the SADAF member who invited you.',
                        };
                    }

                    // Normalise the referralCode field so downstream code
                    // always has the canonical referral code to store.
                    data.referralCode = referrer.referralCode;
                }

                if (isSupabaseConfigured && supabase) {
                    try {
                        const { error: authError } = await supabase.auth.signUp({
                            email: data.email,
                            password: data.password,
                            options: {
                                data: {
                                    fullName: data.fullName,
                                    role: data.role,
                                    referralCode: data.referralCode,
                                    applicationData: data.applicationData,
                                },
                            },
                        });

                        if (authError) throw authError;

                        // Supabase sends a confirmation email — log in locally for UX
                        const loginResult = await login(data.email, data.password);
                        return loginResult;
                    } catch (supabaseErr) {
                        console.warn(
                            'Supabase signup failed, falling back to sandbox:',
                            supabaseErr,
                        );
                        // Fall through to sandbox mode
                    }
                }

                // ── Sandbox mode ─────────────────────────────────────────────
                const users = mockAuth.getUsers();
                const exists = users.some(
                    (u) => u.email.toLowerCase() === data.email.toLowerCase(),
                );
                if (exists) {
                    return { success: false, error: 'This email is already registered.' };
                }

                const newProfile: UserProfile = {
                    id: `usr-${Date.now()}`,
                    email: data.email,
                    role: data.role,
                    fullName: data.fullName,
                    createdAt: new Date().toISOString(),
                    referralCode: `SADAF-${data.fullName.split(' ')[0].toUpperCase().slice(0, 5)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                    referredBy: REFERRAL_REQUIRED_ROLES.includes(data.role)
                        ? data.referralCode
                        : undefined,
                };
                const updated = [...users, newProfile];
                mockAuth.saveUsers(updated);
                mockAuth.setCurrentUser(newProfile);
                setUser(newProfile);
                return { success: true };
            } catch (err: any) {
                return {
                    success: false,
                    error: err.message || 'Registration failed.',
                };
            } finally {
                setIsLoading(false);
            }
        },
        [login],
    );

    // ── Logout ───────────────────────────────────────────────────────────────

    const logout = useCallback(() => {
        mockAuth.clearCurrentUser();
        setUser(null);
    }, []);

    // ── Google Sign-In (Sandbox mode — real OAuth needs Supabase Google provider configured) ──
    //
    // In development the Supabase project may not have Google OAuth enabled, so we
    // always use the local sandbox fallback.  When you enable Google OAuth in your
    // Supabase dashboard, un-comment the real flow below and remove the sandbox path.

    const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        try {
            // ── Sandbox only ─────────────────────────────────────────────
            // Real Supabase OAuth would go here once Google provider is configured.
            // Until then, always use the local mock.

            const profile: UserProfile = {
                id: 'usr-google',
                email: 'google.guest@sadaf.luxury',
                role: 'customer_individual',
                fullName: 'Google Arabic Curator',
                createdAt: new Date().toISOString(),
            };
            mockAuth.setCurrentUser(profile);
            setUser(profile);
            return { success: true };
        } catch (err: any) {
            return {
                success: false,
                error: err.message || 'Google Sign-In failed.',
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AuthContext.Provider
            value={{ user, isLoading, login, signup, logout, signInWithGoogle }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an <AuthProvider>.');
    }
    return ctx;
}
