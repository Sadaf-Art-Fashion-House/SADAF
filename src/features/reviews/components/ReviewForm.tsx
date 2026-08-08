'use client';

/**
 * SADAF | Reviews — Review Form (reusable)
 *
 * Interactive star rating + comment textarea, styled in the app's activity
 * card language (gold accents, mono labels). Used from the orders page to
 * write a review for a delivered order. The caller provides the submit
 * handler; this component only owns form state.
 */

import { useState } from 'react';
import { Star, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

interface ReviewFormProps {
    productName: string;
    onSubmit: (rating: number, comment: string) => Promise<{ ok: boolean; error?: string }>;
    onCancel?: () => void;
}

export default function ReviewForm({ productName, onSubmit, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const activeRating = hoverRating || rating;

    const handleSubmit = async () => {
        if (rating === 0) {
            setStatus({ kind: 'error', text: 'Please select a star rating.' });
            return;
        }
        if (!comment.trim()) {
            setStatus({ kind: 'error', text: 'Please share a few words about your piece.' });
            return;
        }

        setSubmitting(true);
        const result = await onSubmit(rating, comment.trim());
        setSubmitting(false);

        if (result.ok) {
            setStatus({
                kind: 'success',
                text: 'Review submitted — thank you! It now appears on the Reviews page.',
            });
        } else {
            setStatus({ kind: 'error', text: result.error ?? 'Could not submit your review.' });
        }
    };

    return (
        <div className="rounded-xl bg-[#0A0F2C]/80 border border-[#C9A84C]/20 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <MessageSquare size={13} className="text-[#C9A84C]" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                    Write a Review — {productName}
                </span>
            </div>

            {/* Star rating */}
            <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-2">
                    Your Rating
                </span>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            aria-pressed={rating === star}
                            className="transition-transform hover:scale-110 cursor-pointer"
                        >
                            <Star
                                size={22}
                                fill={star <= activeRating ? '#C9A84C' : 'none'}
                                className={star <= activeRating ? 'text-[#C9A84C]' : 'text-slate-600'}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment */}
            <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-2">
                    Your Review
                </span>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience with the craftsmanship, fit, and atelier service..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-[#C9A84C]/50 transition resize-none"
                />
            </div>

            {/* Status */}
            {status && (
                <div
                    role="status"
                    className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] ${
                        status.kind === 'success'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-950/30 border-red-500/30 text-red-300'
                    }`}
                >
                    {status.kind === 'success' ? (
                        <CheckCircle2 size={13} className="shrink-0" />
                    ) : (
                        <AlertTriangle size={13} className="shrink-0" />
                    )}
                    {status.text}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] text-[10px] font-mono font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                    {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
