import type { LucideIcon } from 'lucide-react';

interface DirectionalIconProps {
    /** Directional lucide icon (ArrowRight / ArrowLeft / ChevronRight / ...). */
    icon: LucideIcon;
    size?: number;
    className?: string;
    strokeWidth?: number;
}

/**
 * Renders a directional icon that mirrors horizontally in RTL layouts (when
 * `dir="rtl"` is set by LanguageProvider on <html>). Forward icons (ArrowRight,
 * ChevronRight) point left in RTL and back icons (ArrowLeft, ChevronLeft) point
 * right — always matching the reading direction. Uses `-scale-x-100` (not
 * rotate-180) so diagonal arrows would mirror correctly too.
 */
export function DirectionalIcon({ icon: Icon, size, className, strokeWidth }: DirectionalIconProps) {
    return <Icon size={size} strokeWidth={strokeWidth} className={`rtl:-scale-x-100 ${className ?? ''}`} aria-hidden />;
}
