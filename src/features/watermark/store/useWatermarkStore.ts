'use client';

import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────

export type WatermarkType = 'text' | 'logo';

export type WatermarkPosition =
    | 'tiled'
    | 'center'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

export interface LogoEntry {
    /** Unique ID for this logo entry (crypto.randomUUID or Date.now fallback) */
    id: string;
    /** Base64 data-URL of the uploaded image */
    dataUrl: string;
    /** Optional human-readable label shown in the settings UI */
    label?: string;
}

export interface WatermarkSettings {
    /** Master toggle — when false, no watermark is drawn */
    enabled: boolean;
    /** Which watermark mode is active */
    watermarkType: WatermarkType;
    /** Text displayed as the watermark (text mode) */
    text: string;
    /** CSS colour string — hex, rgb, rgba, or named colour (text mode) */
    color: string;
    /** Opacity 0–1 (e.g. 0.08 = 8 %) applied to both text and logo */
    opacity: number;
    /** Font size in pixels (text mode) */
    fontSize: number;
    /** Rotation angle in degrees (negative = counter-clockwise) */
    rotation: number;
    /** Uploaded logo images (logo mode — supports multiple) */
    logos: LogoEntry[];
    /**
     * Logo size as a fraction of the canvas width (0.05 = 5 %, 0.3 = 30 %).
     * For tiled mode each logo is drawn at this size; for positioned modes
     * the first logo is drawn at this size.
     */
    logoScale: number;
    /** How the watermark is placed on the exported canvas */
    watermarkPosition: WatermarkPosition;
}

interface WatermarkStore {
    settings: WatermarkSettings;
    updateSettings: (partial: Partial<WatermarkSettings>) => void;
    addLogo: (dataUrl: string) => void;
    removeLogo: (id: string) => void;
    updateLogoLabel: (id: string, label: string) => void;
    resetDefaults: () => void;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
    enabled: true,
    watermarkType: 'text',
    text: 'SADAF Analytics',
    color: '#C9A84C',
    opacity: 0.08,
    fontSize: 48,
    rotation: -35,
    logos: [],
    logoScale: 0.12,
    watermarkPosition: 'tiled',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateLogoId(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}

/**
 * sanitizeFilename — converts any string into a filesystem-safe slug.
 * Preserves Arabic characters. Replaces spaces and hyphens with underscores.
 */
export function sanitizeFilename(text: string): string {
    return text.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * getWatermarkExportPrefix — returns a sanitised string to prepend to any
 * export filename derived from the user's watermark settings.
 *
 * - Logo mode with a label:  `{label}_`  (e.g. "sadaf_brand_")
 * - Text mode:               `{text}_`   (e.g. "sadaf_analytics_")
 * - Logo mode without label: `logo_`
 * - Fallback (disabled etc): `''` (empty string)
 *
 * Use this in Analytics Dashboard, ChartCard, KpiCard, etc. so every exported
 * file carries the user's watermark identity.
 */
export function getWatermarkExportPrefix(): string {
    const settings = getWatermarkSettings();
    if (!settings.enabled) return '';

    if (settings.watermarkType === 'logo') {
        const label = settings.logos[0]?.label;
        if (label?.trim()) {
            const slug = sanitizeFilename(label);
            if (slug) return `${slug}_`;
        }
        return 'logo_';
    }

    if (settings.watermarkType === 'text') {
        const slug = sanitizeFilename(settings.text);
        if (slug) return `${slug}_`;
    }

    return '';
}

// ─── Store ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sadaf-watermark-settings';

function loadPersistedSettings(): WatermarkSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_WATERMARK_SETTINGS };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<WatermarkSettings>;
            return { ...DEFAULT_WATERMARK_SETTINGS, ...parsed };
        }
    } catch {
        // ignore corrupt storage
    }
    return { ...DEFAULT_WATERMARK_SETTINGS };
}

function persistSettings(settings: WatermarkSettings): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // storage full or unavailable — silently ignore
    }
}

export const useWatermarkStore = create<WatermarkStore>((set) => ({
    settings: loadPersistedSettings(),

    updateSettings: (partial) =>
        set((state) => {
            const next = { ...state.settings, ...partial };
            persistSettings(next);
            return { settings: next };
        }),

    addLogo: (dataUrl) =>
        set((state) => {
            const newEntry: LogoEntry = {
                id: generateLogoId(),
                dataUrl,
            };
            const next = {
                ...state.settings,
                logos: [...state.settings.logos, newEntry],
            };
            persistSettings(next);
            return { settings: next };
        }),

    removeLogo: (id) =>
        set((state) => {
            const next = {
                ...state.settings,
                logos: state.settings.logos.filter((l) => l.id !== id),
            };
            persistSettings(next);
            return { settings: next };
        }),

    updateLogoLabel: (id, label) =>
        set((state) => {
            const next = {
                ...state.settings,
                logos: state.settings.logos.map((l) =>
                    l.id === id ? { ...l, label: label || undefined } : l,
                ),
            };
            persistSettings(next);
            return { settings: next };
        }),

    resetDefaults: () => {
        persistSettings(DEFAULT_WATERMARK_SETTINGS);
        set({ settings: { ...DEFAULT_WATERMARK_SETTINGS } });
    },
}));

// ─── Helpers for use outside React components ──────────────────────────────

export function getWatermarkSettings(): WatermarkSettings {
    return useWatermarkStore.getState().settings;
}

export function getWatermarkFillStyle(settings?: WatermarkSettings): string | undefined {
    const s = settings ?? getWatermarkSettings();
    if (!s.enabled) return undefined;
    const hex = s.color.replace('#', '');
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${s.opacity})`;
}
