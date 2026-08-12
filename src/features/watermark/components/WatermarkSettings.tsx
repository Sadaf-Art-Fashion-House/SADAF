'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Eye,
    EyeOff,
    Type,
    Palette,
    Sliders,
    RotateCcw,
    RefreshCw,
    FileImage,
    FileText,
    Image as ImageIcon,
    Upload,
    Trash2,
    AlignLeft,
    ArrowDownToLine,
    Grid3X3,
    Move,
    MoveUpLeft,
    MoveUpRight,
    MoveDownLeft,
    MoveDownRight,
    Plus,
    PenLine,
    AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/features/i18n/LanguageProvider';
import type { TranslationKey } from '@/features/i18n/dictionaries';
import { useWatermarkStore, DEFAULT_WATERMARK_SETTINGS } from '../store/useWatermarkStore';
import type { WatermarkSettings, WatermarkType, WatermarkPosition, LogoEntry } from '../store/useWatermarkStore';
import { captureElementWithOklabFix } from '@/shared/utils/captureElementWithOklabFix';
import { logExportError } from '@/features/error-logging';
import { recordExport } from '@/shared/utils/exportHistory';
import { ErrorGuidance } from '@/shared/ui/ErrorGuidance';
import {
    buildExportErrorMessage,
    EXPORT_PREVIEW_RENDER_ERROR,
    EXPORT_GENERIC_ERROR,
    EXPORT_PREVIEW_RENDER_DETAIL,
} from '@/shared/utils/exportErrors';

// ─── Position definitions ──────────────────────────────────────────────────

const POSITION_OPTIONS: { value: WatermarkPosition; icon: LucideIcon }[] = [
    { value: 'tiled', icon: Grid3X3 },
    { value: 'center', icon: Move },
    { value: 'top-left', icon: MoveUpLeft },
    { value: 'top-right', icon: MoveUpRight },
    { value: 'bottom-left', icon: MoveDownLeft },
    { value: 'bottom-right', icon: MoveDownRight },
];

const POSITION_LABEL_KEYS: Record<WatermarkPosition, TranslationKey> = {
    tiled: 'watermark.position.tiled',
    center: 'watermark.position.center',
    'top-left': 'watermark.position.top-left',
    'top-right': 'watermark.position.top-right',
    'bottom-left': 'watermark.position.bottom-left',
    'bottom-right': 'watermark.position.bottom-right',
};

const POSITION_DESC_KEYS: Record<WatermarkPosition, TranslationKey> = {
    tiled: 'watermark.position.tiled.desc',
    center: 'watermark.position.center.desc',
    'top-left': 'watermark.position.top-left.desc',
    'top-right': 'watermark.position.top-right.desc',
    'bottom-left': 'watermark.position.bottom-left.desc',
    'bottom-right': 'watermark.position.bottom-right.desc',
};

const POSITION_LABEL_SHORT: Record<string, string> = {
    center: '⨁',
    'top-left': '↖',
    'top-right': '↗',
    'bottom-left': '↙',
    'bottom-right': '↘',
};

// ─── Preview ───────────────────────────────────────────────────────────────

function WatermarkPreview({ settings }: { settings: WatermarkSettings }) {
    const { t } = useLanguage();

    const fillStyle = useMemo(() => {
        if (!settings.enabled || settings.watermarkType !== 'text') return 'none';
        const hex = settings.color.replace('#', '');
        const r = Number.parseInt(hex.substring(0, 2), 16);
        const g = Number.parseInt(hex.substring(2, 4), 16);
        const b = Number.parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${settings.opacity})`;
    }, [settings]);

    const previewLogos = useMemo(() => settings.logos.slice(0, 2), [settings.logos]);

    // NOTE: The inline <svg> previews below use hex/rgba fills only (no oklab).
    // If this element is ever captured with html2canvas, route it through
    // captureElementWithOklabFix() so Tailwind v4 oklch colors on the
    // surrounding DOM don't crash the snapshot.
    return (
        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/10 bg-[#0A0F2C]">
            <div className="absolute inset-0 flex items-end justify-around px-4 pb-4">
                {[40, 65, 35, 80, 55, 70, 45].map((h, i) => (
                    <div key={i} className="w-6 rounded-t-md transition-all duration-300"
                        style={{ height: `${h}%`, background: `linear-gradient(to top, ${settings.color}88, ${settings.color}22)`, opacity: settings.enabled ? 0.6 : 0.15 }} />
                ))}
            </div>

            {settings.enabled && settings.watermarkType === 'text' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <pattern id="watermark-preview-pattern" patternUnits="userSpaceOnUse" width={settings.fontSize * 4} height={settings.fontSize * 2.5}>
                            <text x={settings.fontSize * 2} y={settings.fontSize * 1.25} textAnchor="middle" dominantBaseline="middle"
                                fill={fillStyle} fontSize={settings.fontSize * 0.6} fontWeight="bold" fontFamily="system-ui, sans-serif"
                                transform={`rotate(${settings.rotation}, ${settings.fontSize * 2}, ${settings.fontSize * 1.25})`}>{settings.text}</text>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#watermark-preview-pattern)" />
                </svg>
            )}

            {settings.enabled && settings.watermarkType === 'logo' && previewLogos.length > 0 && settings.watermarkPosition === 'tiled' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <pattern id="preview-watermark-logo" patternUnits="userSpaceOnUse" width="160" height="120">
                            <image href={previewLogos[0].dataUrl} x="10" y="10" width="140" height="100"
                                opacity={Math.min(settings.opacity * 2, 1)} transform={`rotate(${settings.rotation}, 80, 60)`} preserveAspectRatio="xMidYMid meet" />
                        </pattern>
                        {previewLogos.length > 1 && (
                            <pattern id="preview-watermark-logo-2" patternUnits="userSpaceOnUse" width="200" height="150">
                                <image href={previewLogos[1].dataUrl} x="20" y="15" width="160" height="120"
                                    opacity={Math.min(settings.opacity * 1.5, 1)} transform={`rotate(${settings.rotation + 5}, 100, 75)`} preserveAspectRatio="xMidYMid meet" />
                            </pattern>
                        )}
                    </defs>
                    <rect width="100%" height="100%" fill="url(#preview-watermark-logo)" />
                    {previewLogos.length > 1 && <rect width="100%" height="100%" fill="url(#preview-watermark-logo-2)" />}
                </svg>
            )}

            {settings.enabled && settings.watermarkType === 'logo' && previewLogos.length > 0 && settings.watermarkPosition !== 'tiled' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {(() => {
                        const pos = settings.watermarkPosition; const logoW = 60; const logoH = 40; const margin = 6;
                        let x = margin; let y = margin;
                        if (pos === 'center') { x = (288 - logoW) / 2; y = (128 - logoH) / 2; }
                        if (pos === 'top-right') { x = 288 - logoW - margin; }
                        if (pos === 'bottom-left') { y = 128 - logoH - margin; }
                        if (pos === 'bottom-right') { x = 288 - logoW - margin; y = 128 - logoH - margin; }
                        const cx = x + logoW / 2; const cy = y + logoH / 2;
                        return (
                            <g transform={`rotate(${settings.rotation}, ${cx}, ${cy})`}>
                                <image href={previewLogos[0].dataUrl} x={x} y={y} width={logoW} height={logoH}
                                    opacity={Math.min(settings.opacity * 2, 1)} preserveAspectRatio="xMidYMid meet" />
                                {previewLogos.length > 1 && (
                                    <image href={previewLogos[1].dataUrl} x={x + 8} y={y + 8} width={logoW * 0.75} height={logoH * 0.75}
                                        opacity={Math.min(settings.opacity * 1.5, 1)} preserveAspectRatio="xMidYMid meet" />
                                )}
                                <text x={pos === 'center' ? cx : (pos.startsWith('right') ? x + logoW - 2 : x + 2)}
                                    y={pos === 'center' ? cy + logoH / 2 + 10 : (pos.endsWith('bottom') ? y + logoH + 8 : y - 4)}
                                    textAnchor={pos === 'center' ? 'middle' : (pos.startsWith('right') ? 'end' : 'start')}
                                    fill="rgba(201,168,76,0.5)" fontSize="7" fontFamily="monospace">{POSITION_LABEL_SHORT[pos] || ''}</text>
                            </g>
                        );
                    })()}
                </svg>
            )}

            {!settings.enabled && <div className="absolute inset-0 flex items-center justify-center text-[#E8E0D5]/30 text-[10px] font-mono uppercase tracking-widest">{t('watermark.disabled')}</div>}
            {settings.enabled && settings.watermarkType === 'logo' && previewLogos.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-[#E8E0D5]/30 text-[10px] font-mono uppercase tracking-widest">{t('watermark.uploadLogos')}</div>}
        </div>
    );
}

// ─── Slider control ────────────────────────────────────────────────────────

function SliderControl({ label, icon: Icon, value, min, max, step = 0.01, displayValue, onChange }: {
    label: string; icon: any; value: number; min: number; max: number; step?: number; displayValue?: string; onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60"><Icon size={11} className="text-[#C9A84C]/70" /> {label}</label>
                <span className="text-[10px] font-mono text-[#C9A84C] font-semibold">{displayValue ?? value}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-[#C9A84C]/30 to-[#C9A84C]/60 accent-[#C9A84C]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C9A84C] [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-[#C9A84C]/40 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-125" />
        </div>
    );
}

// ─── Logo card with editable label ─────────────────────────────────────────

function LogoCard({ logo, onRemove, onUpdateLabel }: {
    logo: LogoEntry; onRemove: () => void; onUpdateLabel: (label: string) => void;
}) {
    const { t } = useLanguage();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(logo.label ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    const commitLabel = useCallback(() => {
        setEditing(false);
        const trimmed = draft.trim();
        if (trimmed !== (logo.label ?? '')) onUpdateLabel(trimmed);
        else setDraft(logo.label ?? '');
    }, [draft, logo.label, onUpdateLabel]);

    const startEditing = useCallback(() => {
        setDraft(logo.label ?? ''); setEditing(true);
        requestAnimationFrame(() => inputRef.current?.select());
    }, [logo.label]);

    return (
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0A0F2C]/60 border border-white/10 group hover:border-[#C9A84C]/20 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <img src={logo.dataUrl} alt={logo.label || t('watermark.logoAlt')} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0" onClick={!editing ? startEditing : undefined}>
                {editing ? (
                    <input ref={inputRef} type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitLabel}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') { setDraft(logo.label ?? ''); setEditing(false); } }}
                        className="w-full bg-black/60 border border-[#C9A84C]/40 text-[10px] text-white rounded-md px-2 py-0.5 outline-none focus:border-[#C9A84C] transition font-mono"
                        placeholder={t('watermark.namePlaceholder')} autoFocus />
                ) : (
                    <div className="cursor-text group/label">
                        <p className="text-[10px] font-mono text-[#E8E0D5]/70 truncate flex items-center gap-1.5">
                            {logo.label || <span className="text-[#E8E0D5]/40 italic">{t('watermark.clickToName')}</span>}
                            <PenLine size={9} className="text-[#E8E0D5]/20 group-hover/label:text-[#C9A84C]/60 transition-colors shrink-0" />
                        </p>
                        <p className="text-[7px] font-mono text-[#E8E0D5]/30">{(logo.dataUrl.length * 0.75 / 1024).toFixed(0)} KB</p>
                    </div>
                )}
            </div>
            <button onClick={onRemove}
                className="p-1.5 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title={t('watermark.removeLogo')}><Trash2 size={12} /></button>
        </div>
    );
}

// ─── Logos upload area ─────────────────────────────────────────────────────

function LogosUploadArea({ logos, onAdd, onRemove, onUpdateLabel }: {
    logos: LogoEntry[]; onAdd: (dataUrl: string) => void; onRemove: (id: string) => void; onUpdateLabel: (id: string, label: string) => void;
}) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounterRef = useRef(0);

    const processFile = useCallback((file: File) => {
        if (!['image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) { alert(t('watermark.invalidType')); return; }
        if (file.size > 2 * 1024 * 1024) { alert(t('watermark.tooLarge')); return; }
        const reader = new FileReader();
        reader.onload = () => { if (typeof reader.result === 'string') onAdd(reader.result); };
        reader.readAsDataURL(file);
    }, [onAdd, t]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return; processFile(file);
    }, [processFile]);

    const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current += 1; if (dragCounterRef.current === 1) setIsDragOver(true); }, []);
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current -= 1; if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsDragOver(false); } }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false); dragCounterRef.current = 0;
        const file = e.dataTransfer.files?.[0]; if (!file) return; processFile(file);
    }, [processFile]);

    const dz = 'w-full p-4 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 group';
    const dzIdle = 'border-white/10 hover:border-[#C9A84C]/40 bg-[#0A0F2C]/40 hover:bg-[#0A0F2C]/60';
    const dzActive = 'border-[#C9A84C] bg-[#C9A84C]/10 shadow-lg shadow-[#C9A84C]/20 scale-[1.02]';

    return (
        <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60">
                <ImageIcon size={11} className="text-[#C9A84C]/70" /> {t('watermark.logos.count', { count: logos.length })}
            </label>
            {logos.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {logos.map((logo) => (
                        <LogoCard key={logo.id} logo={logo} onRemove={() => onRemove(logo.id)} onUpdateLabel={(label) => onUpdateLabel(logo.id, label)} />
                    ))}
                </div>
            )}
            <div onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()} className={`${dz} ${isDragOver ? dzActive : dzIdle}`}>
                {isDragOver ? (
                    <><ArrowDownToLine size={20} className="text-[#C9A84C] animate-bounce" /><span className="text-[10px] font-mono text-[#C9A84C] font-semibold">{t('watermark.dropHere')}</span></>
                ) : (
                    <><div className="flex items-center gap-1.5"><Plus size={14} className="text-[#E8E0D5]/30 group-hover:text-[#C9A84C] transition-colors" /><Upload size={14} className="text-[#E8E0D5]/30 group-hover:text-[#C9A84C] transition-colors" /></div>
                        <span className="text-[9px] font-mono text-[#E8E0D5]/40 group-hover:text-[#E8E0D5]/60 transition-colors">{t('watermark.addOrDrop')}</span>
                        <span className="text-[7px] font-mono text-[#E8E0D5]/30">{t('watermark.formatHint')}</span></>
                )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/webp" onChange={handleFileChange} className="hidden" />
        </div>
    );
}

// ─── Position selector ─────────────────────────────────────────────────────

function PositionSelector({ value, onChange }: { value: WatermarkPosition; onChange: (v: WatermarkPosition) => void }) {
    const { t } = useLanguage();

    return (
        <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60"><Grid3X3 size={11} className="text-[#C9A84C]/70" /> {t('watermark.position')}</label>
            <div className="grid grid-cols-3 gap-1.5">
                {POSITION_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => onChange(opt.value)} title={t(POSITION_DESC_KEYS[opt.value])}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-mono transition-all duration-200 cursor-pointer ${
                            value === opt.value ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30 shadow-sm shadow-[#C9A84C]/10'
                                : 'text-[#E8E0D5]/40 border border-transparent hover:text-white hover:bg-white/5'
                        }`}>
                        <opt.icon size={14} /><span className="text-[7px] uppercase tracking-wider">{t(POSITION_LABEL_KEYS[opt.value])}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Mode tabs ─────────────────────────────────────────────────────────────

function ModeTabs({ value, onChange }: { value: WatermarkType; onChange: (v: WatermarkType) => void }) {
    const { t } = useLanguage();

    return (
        <div className="flex items-center gap-1 bg-[#0A0F2C]/60 p-0.5 rounded-lg border border-white/5 w-fit">
            {[
                { id: 'text' as WatermarkType, labelKey: 'watermark.mode.text' as TranslationKey, icon: AlignLeft },
                { id: 'logo' as WatermarkType, labelKey: 'watermark.mode.logo' as TranslationKey, icon: ImageIcon },
            ].map((tab) => (
                <button key={tab.id} onClick={() => onChange(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        value === tab.id ? 'bg-[#C9A84C] text-[#0A0F2C] font-bold' : 'text-[#E8E0D5]/40 hover:text-white'
                    }`}>
                    <tab.icon size={11} /> {t(tab.labelKey)}
                </button>
            ))}
        </div>
    );
}

// ─── Sanitize a string into a filesystem-safe filename ─────────────────────

function sanitizeFilename(text: string): string {
    return text.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')   // keep Arabic letters
        .replace(/[\s-]+/g, '_')                       // spaces/hyphens → underscore
        .replace(/_+/g, '_')                            // collapse multiple underscores
        .replace(/^_|_$/g, '');                         // trim leading/trailing underscore
}

// ─── Main component ────────────────────────────────────────────────────────

export default function WatermarkSettings() {
    const { t } = useLanguage();
    const { settings, updateSettings, addLogo, removeLogo, updateLogoLabel, resetDefaults } = useWatermarkStore();
    const isDefault = useMemo(
        () =>
            settings.watermarkType === DEFAULT_WATERMARK_SETTINGS.watermarkType &&
            settings.text === DEFAULT_WATERMARK_SETTINGS.text &&
            settings.color === DEFAULT_WATERMARK_SETTINGS.color &&
            settings.opacity === DEFAULT_WATERMARK_SETTINGS.opacity &&
            settings.fontSize === DEFAULT_WATERMARK_SETTINGS.fontSize &&
            settings.rotation === DEFAULT_WATERMARK_SETTINGS.rotation &&
            settings.logoScale === DEFAULT_WATERMARK_SETTINGS.logoScale &&
            settings.logos.length === 0 &&
            settings.watermarkPosition === DEFAULT_WATERMARK_SETTINGS.watermarkPosition,
        [settings],
    );

    // Per-format export loading states (PNG and PDF tracked independently so
    // each button shows exactly which export is in progress).
    const [isExportingPNG, setIsExportingPNG] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Inline export error (replaces blocking alert()) — paired with a smart
    // "Try Again" button that re-runs the exact export that failed. The
    // failed format is stored as plain state (not a ref) so the banner is
    // driven purely by reactive re-renders — safe against future code that
    // might mutate a ref without triggering a re-render.
    const [exportError, setExportError] = useState<string | null>(null);
    const [lastFailedExportFormat, setLastFailedExportFormat] = useState<'png' | 'pdf' | null>(null);

    const retryButtonRef = useRef<HTMLButtonElement>(null);

    // Move focus to the banner's Retry button the moment an export failure
    // appears, so keyboard/screen-reader users can act immediately.
    useEffect(() => {
        if (lastFailedExportFormat) {
            retryButtonRef.current?.focus();
        }
    }, [lastFailedExportFormat]);

    // ── Derive descriptive export filename from current settings ──

    const exportFilename = useMemo(() => {
        if (settings.watermarkType === 'logo' && settings.logos.length > 0) {
            const label = settings.logos[0].label;
            if (label?.trim()) {
                const sanitized = sanitizeFilename(label);
                if (sanitized) return `sadaf_${sanitized}`;
            }
            return 'sadaf_watermark_logo';
        }
        if (settings.watermarkType === 'text') {
            const sanitized = sanitizeFilename(settings.text);
            if (sanitized) return `sadaf_${sanitized}`;
        }
        return 'sadaf_watermark_preview';
    }, [settings.watermarkType, settings.logos, settings.text]);

    /**
     * Render the watermark preview directly to a Canvas 2D element — this is
     * the primary path because it bypasses html2canvas entirely (and therefore
     * the oklab parsing issue).
     */
    const renderPreviewToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
        const previewEl = document.getElementById('watermark-preview-container');
        if (!previewEl) return null;

        const rect = previewEl.getBoundingClientRect();
        const w = Math.round(rect.width) || 576;
        const h = Math.round(rect.height) || 128;
        const scale = 2;

        const canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Background
        ctx.fillStyle = '#0A0F2C';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Chart bars (mimic the WatermarkPreview bars)
        const { color, enabled, opacity } = settings;
        if (enabled) {
            const bars = [40, 65, 35, 80, 55, 70, 45];
            const barW = 12 * scale;
            const gap = (canvas.width - bars.length * barW) / (bars.length + 1);
            bars.forEach((hPct, i) => {
                const barH = (hPct / 100) * canvas.height * 0.7;
                const x = gap + i * (barW + gap);
                const y = canvas.height - barH - 16 * scale;
                const grad = ctx.createLinearGradient(x, y + barH, x, y);
                grad.addColorStop(0, color + '77');
                grad.addColorStop(1, color + '22');
                ctx.fillStyle = grad;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.roundRect(x, y, barW, barH, 4 * scale);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            // Watermark overlay (text or logo)
            if (settings.watermarkType === 'text') {
                const hex = color.replace('#', '');
                const r = Number.parseInt(hex.substring(0, 2), 16);
                const g = Number.parseInt(hex.substring(2, 4), 16);
                const b = Number.parseInt(hex.substring(4, 6), 16);
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.font = `bold ${settings.fontSize * 0.6 * scale}px system-ui, sans-serif`;
                ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(settings.rotation * (Math.PI / 180));
                ctx.translate(-canvas.width / 2, -canvas.height / 2);

                const step = settings.fontSize * 6.5 * scale;
                for (let y = -canvas.height; y < canvas.height * 2; y += step) {
                    for (let x = -canvas.width; x < canvas.width * 2; x += step * 0.6) {
                        ctx.fillText(settings.text, x, y);
                    }
                }
                ctx.restore();
            } else if (settings.watermarkType === 'logo' && settings.logos.length > 0) {
                ctx.save();
                ctx.globalAlpha = opacity;
                const logo = settings.logos[0];
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.src = logo.dataUrl;

                if (settings.watermarkPosition === 'tiled') {
                    const logoW = canvas.width * settings.logoScale;
                    const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
                    const logoH = logoW * aspect;
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(settings.rotation * (Math.PI / 180));
                    ctx.translate(-canvas.width / 2, -canvas.height / 2);
                    for (let y = -canvas.height; y < canvas.height * 2; y += logoH * 3.5) {
                        for (let x = -canvas.width; x < canvas.width * 2; x += logoW * 3.5) {
                            ctx.drawImage(img, x, y, logoW, logoH);
                        }
                    }
                } else {
                    const logoW = canvas.width * settings.logoScale * 0.3;
                    const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
                    const logoH = logoW * aspect;
                    const margin = 12 * scale;
                    let lx = margin, ly = margin;
                    const pos = settings.watermarkPosition;
                    if (pos === 'center') { lx = (canvas.width - logoW) / 2; ly = (canvas.height - logoH) / 2; }
                    else if (pos === 'top-right') { lx = canvas.width - logoW - margin; }
                    else if (pos === 'bottom-left') { ly = canvas.height - logoH - margin; }
                    else if (pos === 'bottom-right') { lx = canvas.width - logoW - margin; ly = canvas.height - logoH - margin; }
                    const cx = lx + logoW / 2, cy = ly + logoH / 2;
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(settings.rotation * (Math.PI / 180));
                    ctx.drawImage(img, -logoW / 2, -logoH / 2, logoW, logoH);
                    ctx.restore();
                }
                ctx.restore();
            }
        }

        return canvas;
    }, [settings]);

    /**
     * Capture the preview as a canvas, preferring the direct Canvas 2D path.
     * If that renderer throws (e.g. a future preview element it cannot
     * replicate), fall back to html2canvas through the shared
     * captureElementWithOklabFix() so SVG previews and their Tailwind v4
     * oklch surroundings never crash the snapshot.
     */
    const capturePreviewCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
        const previewEl = document.getElementById('watermark-preview-container');
        if (!previewEl) return null;

        try {
            const directCanvas = await renderPreviewToCanvas();
            if (directCanvas) return directCanvas;
        } catch (err) {
            console.error('Direct preview render failed — falling back to html2canvas:', err);
        }

        try {
            return await captureElementWithOklabFix(previewEl);
        } catch (err) {
            console.error('Fallback preview capture failed:', err);
            return null;
        }
    }, [renderPreviewToCanvas]);

    const handleExportSamplePNG = useCallback(async () => {
        setIsExportingPNG(true);
        setExportError(null);
        setLastFailedExportFormat(null);
        try {
            const canvas = await capturePreviewCanvas();
            if (!canvas) {
                console.error(buildExportErrorMessage('png', exportFilename, EXPORT_PREVIEW_RENDER_DETAIL));
                logExportError('png', exportFilename, EXPORT_PREVIEW_RENDER_DETAIL);
                recordExport({ filename: exportFilename, format: 'png', status: 'failure', source: 'watermark' });
                setLastFailedExportFormat('png');
                setExportError(EXPORT_PREVIEW_RENDER_ERROR);
                return;
            }
            const link = document.createElement('a');
            link.download = `${exportFilename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            recordExport({ filename: exportFilename, format: 'png', status: 'success', source: 'watermark' });
        } catch (err) {
            console.error('PNG export failed:', err);
            logExportError('png', exportFilename, err);
            recordExport({ filename: exportFilename, format: 'png', status: 'failure', source: 'watermark' });
            setLastFailedExportFormat('png');
            setExportError(EXPORT_GENERIC_ERROR);
        } finally {
            setIsExportingPNG(false);
        }
    }, [exportFilename, capturePreviewCanvas]);

    const handleExportSamplePDF = useCallback(async () => {
        setIsExportingPDF(true);
        setExportError(null);
        setLastFailedExportFormat(null);
        try {
            const canvas = await capturePreviewCanvas();
            if (!canvas) {
                console.error(buildExportErrorMessage('pdf', exportFilename, EXPORT_PREVIEW_RENDER_DETAIL));
                logExportError('pdf', exportFilename, EXPORT_PREVIEW_RENDER_DETAIL);
                recordExport({ filename: exportFilename, format: 'pdf', status: 'failure', source: 'watermark' });
                setLastFailedExportFormat('pdf');
                setExportError(EXPORT_PREVIEW_RENDER_ERROR);
                return;
            }
            const imgData = canvas.toDataURL('image/png');
            const { default: jsPDF } = await import('jspdf');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`${exportFilename}.pdf`);
            recordExport({ filename: exportFilename, format: 'pdf', status: 'success', source: 'watermark' });
        } catch (err) {
            console.error('PDF export failed:', err);
            logExportError('pdf', exportFilename, err);
            recordExport({ filename: exportFilename, format: 'pdf', status: 'failure', source: 'watermark' });
            setLastFailedExportFormat('pdf');
            setExportError(EXPORT_GENERIC_ERROR);
        } finally {
            setIsExportingPDF(false);
        }
    }, [exportFilename, capturePreviewCanvas]);

    /** Re-run the last failed export (PNG or PDF) directly from the banner. */
    const handleRetryExport = useCallback(() => {
        if (lastFailedExportFormat === 'png') handleExportSamplePNG();
        else if (lastFailedExportFormat === 'pdf') handleExportSamplePDF();
    }, [lastFailedExportFormat, handleExportSamplePNG, handleExportSamplePDF]);

    const isExportingAny = isExportingPNG || isExportingPDF;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]"><Eye size={16} /></div>
                    <div>
                        <h2 className="text-lg font-serif text-[#C9A84C] font-semibold uppercase tracking-wider">{t('watermark.title')}</h2>
                        <p className="text-[11px] text-slate-400">{t('watermark.subtitle')}</p>
                    </div>
                </div>
                <button onClick={resetDefaults} disabled={isDefault}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider text-[#E8E0D5]/50 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                    title={t('watermark.resetTitle')}><RefreshCw size={11} /> {t('watermark.reset')}</button>
            </div>

            <div id="watermark-preview-container"><WatermarkPreview settings={settings} /></div>

            <ModeTabs value={settings.watermarkType} onChange={(v) => updateSettings({ watermarkType: v })} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5 p-5 bg-[#05081A]/60 border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60">
                            {settings.enabled ? <Eye size={11} className="text-emerald-400" /> : <EyeOff size={11} className="text-red-400" />} {t('watermark.toggleLabel')}
                        </label>
                        <button onClick={() => updateSettings({ enabled: !settings.enabled })}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-300 cursor-pointer ${settings.enabled ? 'bg-[#C9A84C]' : 'bg-white/10'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {settings.watermarkType === 'text' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60"><Type size={11} className="text-[#C9A84C]/70" /> {t('watermark.text')}</label>
                                <input type="text" value={settings.text} onChange={(e) => updateSettings({ text: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-3 outline-none focus:border-[#C9A84C] transition placeholder-slate-600" placeholder="SADAF Analytics" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60"><Palette size={11} className="text-[#C9A84C]/70" /> {t('watermark.color')}</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={settings.color} onChange={(e) => updateSettings({ color: e.target.value })}
                                        className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none" />
                                    <span className="text-[10px] font-mono text-[#E8E0D5]/60">{settings.color}</span>
                                </div>
                            </div>
                        </>
                    )}
                    {settings.watermarkType === 'logo' && (
                        <LogosUploadArea logos={settings.logos} onAdd={addLogo} onRemove={removeLogo} onUpdateLabel={updateLogoLabel} />
                    )}
                </div>

                <div className="space-y-5 p-5 bg-[#05081A]/60 border border-white/5 rounded-2xl">
                    <SliderControl label={t('watermark.opacity')} icon={Sliders} value={settings.opacity} min={0} max={0.5} step={0.01}
                        displayValue={`${Math.round(settings.opacity * 100)}%`} onChange={(v) => updateSettings({ opacity: v })} />
                    {settings.watermarkType === 'logo' && (
                        <PositionSelector value={settings.watermarkPosition} onChange={(v) => updateSettings({ watermarkPosition: v })} />
                    )}
                    {settings.watermarkType === 'text' && (
                        <SliderControl label={t('watermark.fontSize')} icon={Type} value={settings.fontSize} min={16} max={120} step={2}
                            displayValue={`${settings.fontSize}px`} onChange={(v) => updateSettings({ fontSize: v })} />
                    )}
                    {settings.watermarkType === 'logo' && (
                        <SliderControl label={t('watermark.logoSize')} icon={ImageIcon} value={settings.logoScale} min={0.05} max={0.3} step={0.01}
                            displayValue={`${Math.round(settings.logoScale * 100)}%`} onChange={(v) => updateSettings({ logoScale: v })} />
                    )}
                    <SliderControl label={t('watermark.rotation')} icon={RotateCcw} value={settings.rotation} min={-90} max={90} step={1}
                        displayValue={`${settings.rotation}°`} onChange={(v) => updateSettings({ rotation: v })} />
                </div>
            </div>

            {/* Inline export error — with smart Try Again that re-runs the last failed export */}
            {exportError && (
                <div role="alert" className="flex items-start gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-950/25 backdrop-blur-sm">
                    <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="flex-1 min-w-0">
                        <span className="block text-[10px] font-mono text-red-300/90 leading-relaxed">{exportError}</span>
                        <ErrorGuidance className="text-[9px]" />
                    </span>
                    {lastFailedExportFormat && (
                        <button ref={retryButtonRef} onClick={handleRetryExport} disabled={isExportingAny}
                            aria-label={t('watermark.retryFailed', { format: lastFailedExportFormat.toUpperCase() })}
                            className="px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase tracking-wider text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait flex items-center gap-1 shrink-0"
                            title={t('watermark.rerunFailed')}>
                            <RotateCcw size={10} /> {t('watermark.retry')}
                        </button>
                    )}
                    <button onClick={() => { setLastFailedExportFormat(null); setExportError(null); }}
                        aria-label={t('watermark.dismiss')}
                        className="text-[10px] font-mono text-[#E8E0D5]/30 hover:text-white transition-colors cursor-pointer shrink-0"
                        title={t('watermark.dismiss')}>✕</button>
                </div>
            )}

            {/* Footer — shows the resolved filename so the user knows what to expect */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#E8E0D5]/40">{t('watermark.testExport')}</span>
                <button onClick={handleExportSamplePNG} disabled={isExportingAny}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
                    title={isExportingAny ? t('watermark.exportInProgress') : t('watermark.exportSamplePNG')}>
                    {isExportingPNG ? <span className="block w-3 h-3 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /> : <FileImage size={11} />}
                    {isExportingPNG ? t('watermark.exporting') : t('watermark.exportPNG')}
                </button>
                <button onClick={handleExportSamplePDF} disabled={isExportingAny}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider bg-gradient-to-r from-[#C9A84C]/20 to-[#4FC3F7]/10 text-white border border-[#C9A84C]/40 hover:border-[#C9A84C]/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
                    title={isExportingAny ? t('watermark.exportInProgress') : t('watermark.exportSamplePDF')}>
                    {isExportingPDF ? <span className="block w-3 h-3 rounded-full border-2 border-[#4FC3F7] border-t-transparent animate-spin" /> : <FileText size={11} />}
                    {isExportingPDF ? t('watermark.exporting') : t('watermark.exportPDF')}
                </button>
                {/* Live filename preview */}
                <div className="ml-auto flex items-center gap-1.5 text-[8px] font-mono text-[#E8E0D5]/40">
                    <FileImage size={9} /> {exportFilename}.png / .pdf
                </div>
            </div>
        </div>
    );
}
