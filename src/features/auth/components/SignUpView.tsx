'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Mail,
    Lock,
    User,
    CheckCircle,
    AlertCircle,
    Award,
} from 'lucide-react';
import SadafLogo from '@/components/common/SadafLogo';
import type { UserRole } from '@/features/auth/types';
import { ELEVATED_ROLES, ROLE_LABELS, REFERRAL_REQUIRED_ROLES, APPLICATION_REQUIRED_ROLES, APPLICATION_FIELDS } from '@/features/auth/types';
import { ErrorBanner } from '@/shared/ui/ErrorGuidance';

interface SignUpViewProps {
    onSignUp: (data: {
        fullName: string;
        email: string;
        password: string;
        role: UserRole;
        secretPasscode: string;
        referralCode?: string;
        applicationData?: Record<string, string>;
    }) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    success: string | null;
}

export default function SignUpView({
    onSignUp,
    isLoading,
    error,
    success,
}: SignUpViewProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('customer_individual');
    const [secretPasscode, setSecretPasscode] = useState('');
    const [showPasscodeField, setShowPasscodeField] = useState(false);

    // Referral code for customer_family / customer_friend
    const [referralCode, setReferralCode] = useState('');

    // Application fields for designer / company / sales_partner
    const [applicationData, setApplicationData] = useState<Record<string, string>>({});

    // Local validation error (specific field names) — shown INSIDE the component
    const [localError, setLocalError] = useState<string | null>(null);

    const needsReferral = REFERRAL_REQUIRED_ROLES.includes(role);
    const needsApplication = APPLICATION_REQUIRED_ROLES.includes(role);
    const applicationFields = APPLICATION_FIELDS[role] || [];

    const handleRoleChange = (selectedRole: UserRole) => {
        setRole(selectedRole);
        setLocalError(null);
        if (ELEVATED_ROLES.includes(selectedRole)) {
            setShowPasscodeField(true);
        } else {
            setShowPasscodeField(false);
            setSecretPasscode('');
        }
        // Clear referral & application data when switching roles
        setReferralCode('');
        setApplicationData({});
    };

    const handleApplicationFieldChange = (key: string, value: string) => {
        setApplicationData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        // ── Client-side validation with specific field names ─────────────
        const missing: string[] = [];
        if (!fullName.trim()) missing.push('Full legal name');
        if (!email.trim()) missing.push('Email coordinate');
        if (!password.trim()) missing.push('Password');

        if (needsReferral && !referralCode.trim()) {
            missing.push('Referral Code or Username');
        }

        if (needsApplication) {
            for (const f of applicationFields) {
                if (f.required && !(applicationData[f.key] || '').trim()) {
                    missing.push(f.label);
                }
            }
        }

        if (missing.length > 0) {
            setLocalError(
                `Please fill in the following required fields: ${missing.join(', ')}`,
            );
            return;
        }

        await onSignUp({
            fullName,
            email,
            password,
            role,
            secretPasscode,
            referralCode: needsReferral ? referralCode.trim() : undefined,
            applicationData: needsApplication ? applicationData : undefined,
        });
    };

    // Role groups for the selector UI
    const roleGroups: { label: string; roles: UserRole[] }[] = [
        {
            label: 'Customer',
            roles: ['customer_individual', 'customer_family', 'customer_friend'],
        },
        {
            label: 'Creative & Business',
            roles: ['designer', 'company', 'sales_partner'],
        },
        {
            label: 'Administration',
            roles: ['admin_sales', 'admin_media', 'admin_sales_media', 'admin_software', 'admin_super', 'founder'],
        },
    ];

    return (
        <div className="w-full min-h-[70vh] flex items-center justify-center py-12 px-4 relative font-sans text-[#E8E0D5]">
            {/* Dynamic Ambient Background Vector Glows */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#C9A84C]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg bg-[#0A0F2C]/90 border border-[#C9A84C]/25 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-1 border border-[#C9A84C]/10 rounded-2xl pointer-events-none" />

                <div className="flex flex-col items-center text-center mb-6 relative z-10">
                    <SadafLogo size={36} withMarbleBackground={false} />
                    <h2 className="text-xl md:text-2xl font-serif text-[#C9A84C] font-semibold mt-4 uppercase tracking-widest">
                        SADAF IDENTITY SIGN UP
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                        Acquire your exclusive heritage connection interface.
                    </p>
                </div>

                {(error || localError) && (
                    <ErrorBanner tone="red" icon={AlertCircle} message={localError || error} />
                )}

                {success && (
                    <ErrorBanner tone="green" icon={CheckCircle} showGuidance={false}
                        message={<><strong className="text-white block mb-0.5">Registration Registered!</strong><span>{success}</span></>}
                    />
                )}

                <form noValidate onSubmit={handleSubmit} className="space-y-4 relative z-10 text-left">
                    {/* Full Name */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
                            Full legal name
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                <User size={14} />
                            </span>
                            <input
                                id="signup-name"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Layla Al-Khouri"
                                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
                            Email coordinate
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                <Mail size={14} />
                            </span>
                            <input
                                id="signup-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="layla@sadaf.luxury"
                                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
                            Lustrous cipher key
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock size={14} />
                            </span>
                            <input
                                id="signup-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
                            />
                        </div>
                    </div>

                    {/* Role selection — grouped by category */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
                            Select Role Authorization Link
                        </label>

                        {roleGroups.map((group) => (
                            <div key={group.label} className="mb-4 last:mb-0">
                                <span className="block text-[9px] font-mono uppercase tracking-[0.15em] text-[#C9A84C]/70 mb-2 px-1">
                                    {group.label}
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {group.roles.map((r) => {
                                        const isSelected = role === r;
                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => handleRoleChange(r)}
                                                className={`p-2.5 rounded-xl border select-none text-left flex flex-col justify-between transition-all duration-200 h-16 cursor-pointer ${
                                                    isSelected
                                                        ? ELEVATED_ROLES.includes(r)
                                                            ? 'bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]'
                                                            : 'bg-[#4FC3F7]/10 border-[#4FC3F7] text-[#4FC3F7]'
                                                        : 'bg-black/35 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                            >
                                                <span className="text-[10px] font-serif font-bold leading-tight">
                                                    {ROLE_LABELS[r]}
                                                </span>
                                                {ELEVATED_ROLES.includes(r) && (
                                                    <span className="text-[7px] font-mono tracking-wider text-[#C9A84C]/60 uppercase">
                                                        🔒 Elevated
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Referral code for family / friend signups */}
                    {needsReferral && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 bg-[#111A45]/40 border border-[#C9A84C]/20 rounded-xl space-y-2"
                        >
                            <div className="flex justify-between items-center text-[10px] text-[#C9A84C] font-mono uppercase tracking-wider font-semibold">
                                <span>Referral Code or Username (Required)</span>
                                <span className="text-slate-500 text-[8px] italic">
                                    Ask your referrer for their code or email
                                </span>
                            </div>
                            <p className="text-[9px] text-[#E8E0D5]/50 leading-relaxed">
                                {role === 'customer_family'
                                    ? 'Family accounts receive shared benefits and discounts. You need a referral code OR username (email) from an existing SADAF customer who sponsors your family membership.'
                                    : 'Friend accounts earn rewards through referrals. You need a referral code OR username (email) from an existing SADAF customer who invites you to the network.'}
                            </p>
                            <input
                                type="text"
                                required
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="e.g. SADAF-LAYLA-7X2 or layla@sadaf.luxury"
                                className="w-full bg-black/60 border border-[#C9A84C]/20 text-[11px] text-white placeholder-slate-600 rounded-lg p-2 outline-none focus:border-[#4FC3F7] transition"
                            />
                        </motion.div>
                    )}

                    {/* Application fields for designer / company / sales_partner */}
                    {needsApplication && applicationFields.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 bg-[#111A45]/40 border border-[#C9A84C]/20 rounded-xl space-y-3"
                        >
                            <div className="text-[10px] text-[#C9A84C] font-mono uppercase tracking-wider font-semibold">
                                Application Details
                            </div>
                            <p className="text-[9px] text-[#E8E0D5]/50 leading-relaxed">
                                {role === 'designer'
                                    ? 'Submit your design credentials for review. Our curation team will verify your portfolio before approving your designer account.'
                                    : role === 'company'
                                    ? 'Register your business for brand partnerships. We verify company details before approving bulk ordering and AI Studio access.'
                                    : 'Apply to become a SADAF sales partner. Our partnerships team will review your application and contact you.'}
                            </p>
                            {applicationFields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/60 mb-1">
                                        {field.label}
                                        {field.required && (
                                            <span className="text-red-400 ml-1">*</span>
                                        )}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            required={field.required}
                                            value={applicationData[field.key] || ''}
                                            onChange={(e) =>
                                                handleApplicationFieldChange(field.key, e.target.value)
                                            }
                                            placeholder={field.placeholder}
                                            rows={3}
                                            className="w-full bg-black/60 border border-[#C9A84C]/20 text-[11px] text-white placeholder-slate-600 rounded-lg p-2 outline-none focus:border-[#4FC3F7] transition resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            value={applicationData[field.key] || ''}
                                            onChange={(e) =>
                                                handleApplicationFieldChange(field.key, e.target.value)
                                            }
                                            placeholder={field.placeholder}
                                            className="w-full bg-black/60 border border-[#C9A84C]/20 text-[11px] text-white placeholder-slate-600 rounded-lg p-2 outline-none focus:border-[#4FC3F7] transition"
                                        />
                                    )}
                                    {field.description && (
                                        <p className="text-[8px] text-[#E8E0D5]/40 mt-0.5 leading-relaxed">
                                            {field.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Secret passcode for elevated roles */}
                    {showPasscodeField && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 bg-[#111A45]/40 border border-[#C9A84C]/20 rounded-xl space-y-2"
                        >
                            <div className="flex justify-between items-center text-[10px] text-[#C9A84C] font-mono uppercase tracking-wider font-semibold">
                                <span>Passcode key authorization</span>
                                <span className="text-slate-500 text-[8px] italic">
                                    demo use: &quot;sadaf123&quot;
                                </span>
                            </div>
                            <input
                                type="password"
                                required
                                value={secretPasscode}
                                onChange={(e) => setSecretPasscode(e.target.value)}
                                placeholder="Enter specialized passcode coordinate"
                                className="w-full bg-black/60 border border-[#C9A84C]/20 text-[11px] text-white placeholder-slate-600 rounded-lg p-2 outline-none focus:border-red-400 transition"
                            />
                        </motion.div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 hover:text-[#0A0F2C] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#C9A84C]/15"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-[#0A0F2C] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Register Secure Persona <Award size={13} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center border-t border-white/5 pt-4 w-full text-xs">
                    <span className="text-slate-500">
                        Already have an elite coordinate?
                    </span>{' '}
                    <Link
                        href="/auth"
                        className="text-[#C9A84C] hover:text-[#4FC3F7] font-semibold underline"
                    >
                        Access account link
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}