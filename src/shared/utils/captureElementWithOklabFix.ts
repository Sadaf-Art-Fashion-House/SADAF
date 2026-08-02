'use client';

import html2canvas from 'html2canvas';
import { normalizeUnsupportedColorFunctions } from './normalizeColors';

/**
 * captureElementWithOklabFix — a safe html2canvas wrapper.
 *
 * Tailwind CSS v4 emits `oklch()`/`oklab()` colors which html2canvas (v1.4.1)
 * cannot parse — it throws "Attempting to parse an unsupported color
 * function" and the export silently fails. This wrapper always rewrites those
 * colors to hex inside the cloned snapshot (via `onclone`) before the
 * element is rasterized.
 *
 * Use this helper ANYWHERE a DOM element (chart, KPI card, watermark preview,
 * SVG preview…) is captured with html2canvas — never call html2canvas
 * directly, otherwise the oklab crash comes back.
 */
export async function captureElementWithOklabFix(
    element: HTMLElement,
    options: {
        backgroundColor?: string;
        scale?: number;
    } = {},
): Promise<HTMLCanvasElement> {
    const { backgroundColor = '#0A0F2C', scale = 2 } = options;

    return html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        logging: false,
        allowTaint: false,
        onclone: (documentClone) => normalizeUnsupportedColorFunctions(documentClone),
    });
}
