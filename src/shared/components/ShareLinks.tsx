'use client';

/**
 * SADAF | Shared — Share Links
 *
 * Social share buttons (WhatsApp / Facebook / X / Telegram / Email) plus a
 * native-share button with a copy fallback. Used for referral links and any
 * other shareable URL. Each network opens its share intent in a new tab;
 * the native share uses the Web Share API and copies the link when the API
 * is unavailable (labels are translated via the shared i18n system).
 */

import { useState } from 'react';
import {
    Check,
    Facebook,
    Mail,
    MessageCircle,
    Send,
    Share2,
    Twitter,
} from 'lucide-react';
import { useLanguage } from '@/features/i18n/LanguageProvider';

interface ShareLinksProps {
    /** The URL to share. */
    url: string;
    /** Optional share text prepended on networks that support it. */
    text?: string;
    /** Accessible label for the whole button row. */
    ariaLabel?: string;
}

export function ShareLinks({ url, text = '', ariaLabel }: ShareLinksProps) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    const targets = [
        {
            key: 'whatsapp',
            label: t('share.whatsapp'),
            href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            Icon: MessageCircle,
            accent: 'hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/40',
        },
        {
            key: 'facebook',
            label: t('share.facebook'),
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            Icon: Facebook,
            accent: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/40',
        },
        {
            key: 'x',
            label: t('share.x'),
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
            Icon: Twitter,
            accent: 'hover:bg-white/10 hover:text-white hover:border-white/30',
        },
        {
            key: 'telegram',
            label: t('share.telegram'),
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
            Icon: Send,
            accent: 'hover:bg-[#2AABEE]/10 hover:text-[#2AABEE] hover:border-[#2AABEE]/40',
        },
        {
            key: 'email',
            label: t('share.email'),
            href: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
            Icon: Mail,
            accent: 'hover:bg-white/10 hover:text-white hover:border-white/30',
        },
    ];

    const handleNativeShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: text || url, url });
            } catch {
                // User dismissed the native share sheet — not an error, ignore.
            }
            return;
        }
        // No Web Share API — fall back to copying the link.
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2_000);
        } catch {
            // Clipboard blocked (permissions / non-secure context) — surface the
            // share row anyway; the network buttons remain usable.
        }
    };

    const buttonBase =
        'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-black/30 text-[#E8E0D5]/70 transition-all duration-200';

    return (
        <div className="flex flex-wrap items-center gap-2" aria-label={ariaLabel}>
            {targets.map(({ key, label, href, Icon, accent }) => (
                <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    aria-label={label}
                    className={`${buttonBase} hover:scale-105 ${accent}`}
                >
                    <Icon size={15} />
                </a>
            ))}
            <button
                type="button"
                onClick={handleNativeShare}
                title={t('share.more')}
                aria-label={t('share.more')}
                className={`${buttonBase} hover:scale-105 hover:bg-white/10 hover:text-white hover:border-white/30 cursor-pointer`}
            >
                {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
            </button>
        </div>
    );
}
