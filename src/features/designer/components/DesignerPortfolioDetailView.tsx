'use client';

/**
 * SADAF | Designer — Portfolio Project Detail View (pure presentation)
 *
 * Full detail of a single portfolio project: hero image, pipeline status,
 * the complete description, atelier feedback, and — when the project is a
 * team effort — the list of collaborators with their roles. Solo projects
 * show a single-designer badge instead.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    User,
    Calendar,
    Tag,
    MessageSquareQuote,
    Crown,
    UserPlus,
    X,
    CheckCircle2,
} from 'lucide-react';
import type { DesignCollaborator, DesignSubmission } from '../types';
import { DESIGN_STATUS_STYLES, COLLABORATOR_PRESETS } from '../constants';
import { COMMISSION_POOL_RATE, computeCommissionSplit, participantsFor } from '../utils/commissionSplit';
import { formatRelativeTime } from '@/features/notifications/utils/formatRelativeTime';
import { ROUTES } from '@/config/routes';

interface DesignerPortfolioDetailViewProps {
    submission: DesignSubmission | null;
    error: string | null;
    /** Whether the signed-in user is the immutable owner — only they can add. */
    isOwner?: boolean;
    addingCollaborator?: boolean;
    /** Credit a collaborator (add-only) — same contract as the review form. */
    onAddCollaborator?: (
        collaborator: DesignCollaborator,
    ) => Promise<{ ok: boolean; error?: string }>;
}

export default function DesignerPortfolioDetailView({
    submission,
    error,
    isOwner = false,
    addingCollaborator = false,
    onAddCollaborator,
}: DesignerPortfolioDetailViewProps) {
    if (!submission) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="inline-flex p-4 rounded-full bg-[#A78BFA]/5 border border-[#A78BFA]/10 mb-4">
                        <User size={24} className="text-[#A78BFA]/60" />
                    </div>
                    <h2 className="text-lg font-serif text-white mb-2">Project not found</h2>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                        {error ?? 'This project does not exist or was removed from your portfolio.'}
                    </p>
                    <Link
                        href={ROUTES.DASHBOARD_DESIGNER}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#4FC3F7] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105"
                    >
                        <ArrowLeft size={13} /> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const style = DESIGN_STATUS_STYLES[submission.status];
    const isTeam = submission.collaboration?.type === 'team';
    const ownerId = submission.collaboration?.ownerId;
    const members = submission.collaboration?.members ?? [];

    // Credits model: the owner is always a credited participant — rendered
    // as the first row (with the OWNER badge) and included in the split.
    const participants = participantsFor(submission.collaboration);

    // Add-collaborator form state (owner only).
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [roleInput, setRoleInput] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [addedOk, setAddedOk] = useState(false);

    const selectedPreset = COLLABORATOR_PRESETS.find((p) => p.id === selectedPresetId);

    // Projected commission shares — shown once the atelier commits to
    // producing the piece (approved / in production).
    const paidStage = submission.status === 'approved' || submission.status === 'in_production';
    const commissionShares = useMemo(
        () =>
            isTeam && paidStage
                ? computeCommissionSplit(participants, submission.price)
                : [],
        [isTeam, paidStage, participants, submission.price],
    );
    const commissionPool = Math.round(submission.price * COMMISSION_POOL_RATE * 100) / 100;

    const handleAdd = async () => {
        setAddError(null);
        setAddedOk(false);
        if (!selectedPreset || !roleInput.trim()) {
            setAddError('Pick a collaborator and give them a role.');
            return;
        }
        if (!onAddCollaborator) return;
        const result = await onAddCollaborator({
            id: selectedPreset.id,
            name: selectedPreset.name,
            role: roleInput.trim(),
            avatarUrl: selectedPreset.avatarUrl,
        });
        if (result.ok) {
            setAddedOk(true);
            setShowAddForm(false);
            setSelectedPresetId('');
            setRoleInput('');
        } else {
            setAddError(result.error ?? 'Could not add the collaborator.');
        }
    };

    // Multi-image gallery: main view first, then hover/alternate + sketches.
    const gallery = [
        ...(submission.imageUrl ? [{ url: submission.imageUrl, label: 'Main View' }] : []),
        ...(submission.galleryImages ?? []),
    ];
    const [activeImage, setActiveImage] = useState(gallery[0] ?? null);

    return (
        <div className="min-h-screen bg-[#0A0F2C] pb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
                {/* Back link */}
                <Link
                    href={ROUTES.DASHBOARD_DESIGNER}
                    className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#A78BFA] hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={12} /> Back to Portfolio
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image gallery: main view + hover/alternate + concept sketches */}
                    <div className="flex flex-col gap-3">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-[#141B4D] to-[#0A0F2C] border border-white/5">
                            {activeImage ? (
                                // eslint-disable-next-line @next/next/no-img-element -- previews (data URLs + seeds) can't use next/image
                                <img
                                    src={activeImage.url}
                                    alt={`${submission.title} — ${activeImage.label}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="font-serif text-8xl text-[#A78BFA]/20">
                                        {submission.title.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <span className={`absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono uppercase tracking-wider ${style.chip}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                {style.label}
                            </span>
                            {activeImage && gallery.length > 1 && (
                                <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded-full bg-[#0A0F2C]/80 backdrop-blur-sm border border-white/10 text-[9px] font-mono uppercase tracking-wider text-[#A78BFA]">
                                    {activeImage.label}
                                </span>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {gallery.length > 1 && (
                            <div className="flex gap-2.5">
                                {gallery.map((image, index) => (
                                    <button
                                        key={`${image.url}-${index}`}
                                        onClick={() => setActiveImage(image)}
                                        aria-pressed={activeImage?.url === image.url}
                                        title={image.label}
                                        className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                                            activeImage?.url === image.url
                                                ? 'border-[#A78BFA] shadow-[0_0_12px_rgba(167,139,250,0.25)]'
                                                : 'border-white/10 hover:border-[#A78BFA]/50 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element -- previews can't use next/image */}
                                        <img
                                            src={image.url}
                                            alt={image.label}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-5">
                        <div>
                            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#A78BFA]/70 mb-2">
                                {submission.category} Label · {submission.id.toUpperCase()}
                            </p>
                            <h1 className="font-serif text-2xl md:text-3xl text-white uppercase tracking-tight leading-tight">
                                {submission.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-mono text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={11} className="text-[#A78BFA]/70" />
                                    Submitted {formatRelativeTime(submission.submittedAt)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Tag size={11} className="text-[#A78BFA]/70" />
                                    {submission.category}
                                </span>
                            </div>
                        </div>

                        <p className="text-3xl font-serif text-[#C9A84C] font-bold">
                            ${submission.price.toLocaleString()}
                        </p>

                        {/* Full description */}
                        <div>
                            <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold mb-2">
                                Design Concept
                            </h2>
                            <p className="text-sm text-[#E8E0D5]/75 leading-relaxed">
                                {submission.description}
                            </p>
                        </div>

                        {/* Atelier feedback */}
                        {submission.adminNote && (
                            <div className="p-4 rounded-2xl bg-[#0F1535] border border-white/5">
                                <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold mb-2">
                                    <MessageSquareQuote size={12} /> Atelier Feedback
                                </p>
                                <p className="text-xs text-[#E8E0D5]/70 italic leading-relaxed">
                                    “{submission.adminNote}”
                                </p>
                            </div>
                        )}

                        {/* Collaboration: solo vs team — credits model (add-only) */}
                        <div className="p-4 rounded-2xl bg-[#0F1535] border border-white/5">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">
                                    {isTeam ? <Users size={12} /> : <User size={12} />}
                                    {isTeam ? `Team Project · ${participants.length} Members` : 'Individual Project'}
                                </p>
                                {isOwner && !showAddForm && (
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/30 text-[#A78BFA] text-[9px] font-mono uppercase tracking-wider hover:bg-[#A78BFA]/20 transition-all duration-300 cursor-pointer"
                                    >
                                        <UserPlus size={10} /> Add Collaborator
                                    </button>
                                )}
                            </div>

                            {/* Add-collaborator form — credits are add-only, so no
                                remove option exists anywhere (that would rewrite history). */}
                            {showAddForm && (
                                <div className="mb-4 p-3 rounded-xl bg-[#0A0F2C]/80 border border-[#A78BFA]/20 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">
                                            Credit a collaborator
                                        </span>
                                        <button
                                            onClick={() => setShowAddForm(false)}
                                            aria-label="Close add collaborator form"
                                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={selectedPresetId}
                                            onChange={(e) => setSelectedPresetId(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-[#A78BFA]/50 transition"
                                        >
                                            <option value="">Select person…</option>
                                            {COLLABORATOR_PRESETS.map((preset) => (
                                                <option key={preset.id} value={preset.id}>
                                                    {preset.name} — {preset.role}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            value={roleInput}
                                            onChange={(e) => setRoleInput(e.target.value)}
                                            placeholder="Role on this piece (e.g. Embroidery Artisan)"
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white placeholder:text-slate-600 outline-none focus:border-[#A78BFA]/50 transition"
                                        />
                                    </div>
                                    {addError && (
                                        <p role="alert" className="text-[10px] text-red-400">
                                            {addError}
                                        </p>
                                    )}
                                    {addedOk && (
                                        <p className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                                            <CheckCircle2 size={11} /> Collaborator credited — thank you!
                                        </p>
                                    )}
                                    <button
                                        onClick={handleAdd}
                                        disabled={addingCollaborator}
                                        className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A78BFA] text-[#0A0F2C] text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#C4B5FD] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        <UserPlus size={10} />
                                        {addingCollaborator ? 'Adding…' : 'Credit Collaborator'}
                                    </button>
                                </div>
                            )}

                            {isTeam ? (
                                <div className="flex flex-col gap-3">
                                    {participants.map((member) => {
                                        const share = commissionShares.find(
                                            (s) => s.memberId === member.id,
                                        );
                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#4FC3F7] flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0">
                                                    {member.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element -- avatar pattern matches the reviews cards
                                                        <img
                                                            src={member.avatarUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        member.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="flex items-center gap-2 text-xs text-white font-medium">
                                                        {member.name}
                                                        {member.id === ownerId && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C9A84C]/15 text-[#C9A84C] text-[8px] font-mono uppercase tracking-wider border border-[#C9A84C]/40 font-bold">
                                                                <Crown size={8} /> Owner
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-[#A78BFA]/70 font-mono uppercase tracking-wider">
                                                        {member.role}
                                                    </p>
                                                    {member.creditedAt && (
                                                        <p className="text-[9px] text-slate-500 font-mono">
                                                            Credited on{' '}
                                                            {new Date(member.creditedAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                                {share && (
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[10px] font-mono text-[#C9A84C] font-bold">
                                                            {share.percent}%
                                                        </p>
                                                        <p className="text-[8px] font-mono text-slate-500">
                                                            ${share.amount.toLocaleString()} / unit
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-[#E8E0D5]/60 leading-relaxed">
                                    Designed and submitted by a single designer — no collaborators
                                    on this project. The owner can credit collaborators at any time.
                                </p>
                            )}
                        </div>

                        {/* Projected commission split — the team list is the basis
                            for money once the atelier commits to producing the piece. */}
                        {isTeam && paidStage && (
                            <div className="p-4 rounded-2xl bg-[#0F1535] border border-[#C9A84C]/20">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold mb-2">
                                    Projected Commission Split
                                </p>
                                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                                    Atelier commission pool: {Math.round(COMMISSION_POOL_RATE * 100)}%
                                    of retail (${commissionPool.toLocaleString()} per unit) — split
                                    equally across the {participants.length} credited collaborators.
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {commissionShares.map((share) => {
                                        const member = participants.find((m) => m.id === share.memberId);
                                        if (!member) return null;
                                        return (
                                            <div
                                                key={share.memberId}
                                                className="flex items-center justify-between text-[10px]"
                                            >
                                                <span className="text-slate-300 truncate">
                                                    {member.name}
                                                    {member.id === ownerId && (
                                                        <span className="ml-1.5 text-[8px] font-mono uppercase text-[#C9A84C]/80">
                                                            (owner)
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="font-mono text-[#C9A84C] shrink-0 ml-3">
                                                    {share.percent}% · ${share.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
