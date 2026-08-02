'use client';

import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import {
    getWatermarkFillStyle,
    getWatermarkSettings,
} from '@/features/watermark/store/useWatermarkStore';
import type { WatermarkPosition } from '@/features/watermark/store/useWatermarkStore';
import { captureElementWithOklabFix } from '@/shared/utils/captureElementWithOklabFix';
import { logExportError } from '@/features/error-logging';
import { recordExport } from '@/shared/utils/exportHistory';
import type { ExportSource } from '@/shared/utils/exportHistory';
import {
    buildExportErrorMessage,
    buildExportUserMessage,
    EXPORT_NO_ELEMENTS_DETAIL,
} from '@/shared/utils/exportErrors';

// ─── Watermark overlay ─────────────────────────────────────────────────────

/**
 * Compute the (x, y) for a single positioned watermark based on the desired
 * placement and the logo/image dimensions.
 */
function getPositionCoordinates(
    position: WatermarkPosition,
    canvasW: number,
    canvasH: number,
    logoW: number,
    logoH: number,
    margin = 24,
): { x: number; y: number } {
    switch (position) {
        case 'center':
            return { x: (canvasW - logoW) / 2, y: (canvasH - logoH) / 2 };
        case 'top-left':
            return { x: margin, y: margin };
        case 'top-right':
            return { x: canvasW - logoW - margin, y: margin };
        case 'bottom-left':
            return { x: margin, y: canvasH - logoH - margin };
        case 'bottom-right':
            return { x: canvasW - logoW - margin, y: canvasH - logoH - margin };
        default:
            return { x: 0, y: 0 };
    }
}

/**
 * Draw a single logo onto the canvas at the given position with optional
 * translation offset for staggering multiple logos.
 */
function drawPositionedLogo(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasW: number,
    canvasH: number,
    logoScale: number,
    rotation: number,
    position: WatermarkPosition,
): void {
    const logoW = canvasW * logoScale;
    const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
    const logoH = logoW * aspect;
    const { x, y } = getPositionCoordinates(position, canvasW, canvasH, logoW, logoH);
    const cx = x + logoW / 2;
    const cy = y + logoH / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation * (Math.PI / 180));
    ctx.drawImage(img, -logoW / 2, -logoH / 2, logoW, logoH);
    ctx.restore();
}

/**
 * Draw a single logo tiled diagonally across the full canvas.
 */
function drawTiledLogo(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasW: number,
    canvasH: number,
    logoScale: number,
    rotation: number,
): void {
    const logoW = canvasW * logoScale;
    const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
    const logoH = logoW * aspect;
    const stepX = logoW * 3.5;
    const stepY = logoH * 3.5;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(rotation * (Math.PI / 180));
    ctx.translate(-canvasW / 2, -canvasH / 2);

    const startX = -canvasW;
    const startY = -canvasH;
    const endX = canvasW * 2;
    const endY = canvasH * 2;

    for (let y = startY; y < endY; y += stepY) {
        for (let x = startX; x < endX; x += stepX) {
            ctx.drawImage(img, x, y, logoW, logoH);
        }
    }

    ctx.restore();
}

/**
 * drawWatermark — draws a watermark on a canvas element after html2canvas.
 *
 * Supports two modes:
 * - 'text' — tiled text string
 * - 'logo' — one or more logos in any position (tiled / center / corners)
 */
function drawWatermark(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fillStyle = getWatermarkFillStyle();
    if (!fillStyle) return;

    const settings = getWatermarkSettings();
    const { watermarkPosition, logos, logoScale, opacity, rotation } = settings;

    // ── Logo mode ──
    if (settings.watermarkType === 'logo' && logos.length > 0) {
        // Pre-load all images (data-URLs are synchronous)
        const images = logos.map((logo) => {
            const img = new window.Image();
            img.src = logo.dataUrl;
            return img;
        });

        ctx.save();
        ctx.globalAlpha = opacity;

        if (watermarkPosition === 'tiled') {
            // Tile every logo — they overlap for a rich watermark texture
            for (const img of images) {
                drawTiledLogo(ctx, img, canvas.width, canvas.height, logoScale, rotation);
            }
        } else {
            // Positioned mode: stack logos with simple translate stagger.
            // Each additional logo is slightly smaller, slightly more rotated,
            // and offset 6px down-right so they don't cover each other perfectly.
            for (let i = 0; i < images.length; i++) {
                const adjustedScale = i === 0
                    ? logoScale
                    : logoScale * Math.max(0.5, 1 - i * 0.15);
                const slightRotation = rotation + i * 3;

                ctx.save();
                ctx.translate(i * 6, i * 6);
                drawPositionedLogo(
                    ctx,
                    images[i],
                    canvas.width,
                    canvas.height,
                    adjustedScale,
                    slightRotation,
                    watermarkPosition,
                );
                ctx.restore();
            }

            // Re-draw the first logo on top at exact position (no stagger)
            // at the same opacity so it reads clearly.
            drawPositionedLogo(
                ctx,
                images[0],
                canvas.width,
                canvas.height,
                logoScale,
                rotation,
                watermarkPosition,
            );
        }

        ctx.restore();
        return;
    }

    // ── Text mode (default) ──
    ctx.save();
    ctx.font = `bold ${settings.fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * (Math.PI / 180));
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const step = settings.fontSize * 6.5;
    const stepY = settings.fontSize * 4;
    const startX = -canvas.width;
    const startY = -canvas.height;
    const endX = canvas.width * 2;
    const endY = canvas.height * 2;

    for (let y = startY; y < endY; y += stepY) {
        for (let x = startX; x < endX; x += step) {
            ctx.fillText(settings.text, x, y);
        }
    }

    ctx.restore();
}

// ─── Shared capture helper ─────────────────────────────────────────────────

export async function captureElementWithWatermark(element: HTMLElement): Promise<HTMLCanvasElement> {
    const canvas = await captureElementWithOklabFix(element);
    drawWatermark(canvas);
    return canvas;
}

// ─── Hook: single element export ───────────────────────────────────────────

/**
 * useExportChart — provides functions to capture a DOM element (e.g. a chart
 * container) and download it as PNG or PDF with an embedded watermark.
 *
 * Loading state is tracked per format (`isExportingPNG` / `isExportingPDF`)
 * so buttons can show exactly which export is in progress, while
 * `isExporting` remains available for disabling both at once.
 *
 * Each export function resolves to a boolean — `true` on success, `false`
 * on failure (or when the target element is missing). Consumers can use this
 * to keep UI (e.g. an open dropdown) open on failure so the error message is
 * immediately visible.
 *
 * Every result is also recorded in the local export history (last 10
 * operations) so the dashboard can show what was exported, when, and
 * whether it succeeded. Failures are additionally reported through the
 * shared error-logging system (digest `export:<format>:<filename>`).
 */
export function useExportChart(
    elementRef: React.RefObject<HTMLDivElement | null>,
    filename: string,
    source: ExportSource = 'chart',
) {
    const [isExportingPNG, setIsExportingPNG] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const exportAsPNG = useCallback(async (): Promise<boolean> => {
        const element = elementRef.current;
        if (!element) return false;

        setIsExportingPNG(true);
        setExportError(null);

        try {
            const canvas = await captureElementWithWatermark(element);
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            recordExport({ filename, format: 'png', status: 'success', source });
            return true;
        } catch (err) {
            console.error('PNG export failed:', err);
            setExportError(buildExportUserMessage('png', filename));
            logExportError('png', filename, err);
            recordExport({ filename, format: 'png', status: 'failure', source });
            return false;
        } finally {
            setIsExportingPNG(false);
        }
    }, [elementRef, filename, source]);

    const exportAsPDF = useCallback(async (): Promise<boolean> => {
        const element = elementRef.current;
        if (!element) return false;

        setIsExportingPDF(true);
        setExportError(null);

        try {
            const canvas = await captureElementWithWatermark(element);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`${filename}.pdf`);
            recordExport({ filename, format: 'pdf', status: 'success', source });
            return true;
        } catch (err) {
            console.error('PDF export failed:', err);
            setExportError(buildExportUserMessage('pdf', filename));
            logExportError('pdf', filename, err);
            recordExport({ filename, format: 'pdf', status: 'failure', source });
            return false;
        } finally {
            setIsExportingPDF(false);
        }
    }, [elementRef, filename, source]);

    return {
        exportAsPNG,
        exportAsPDF,
        isExporting: isExportingPNG || isExportingPDF,
        isExportingPNG,
        isExportingPDF,
        exportError,
        clearError: () => setExportError(null),
    };
}

// ─── Standalone: multi-element PDF export ──────────────────────────────────

/**
 * exportElementsAsPDF — standalone utility that captures multiple DOM elements
 * (by their IDs), applies the watermark to each, and saves them as a
 * multi-page PDF.
 *
 * Resolves to `true` when the PDF was saved, `false` when it failed — so
 * callers can surface a visible error instead of failing silently. Every
 * result is recorded in the local export history; failures are additionally
 * reported through the shared error-logging system.
 */
export async function exportElementsAsPDF(
    elementIds: string[],
    filename: string,
    setIsExporting?: (v: boolean) => void,
    source: ExportSource = 'report',
): Promise<boolean> {
    setIsExporting?.(true);

    try {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;
        const imgMaxWidth = pageWidth - margin * 2;
        let capturedAny = false;

        for (let i = 0; i < elementIds.length; i++) {
            const el = document.getElementById(elementIds[i]);
            if (!el) continue;

            const canvas = await captureElementWithWatermark(el);
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * imgMaxWidth) / canvas.width;

            if (i > 0) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'PNG', margin, margin, imgMaxWidth, imgHeight);
            capturedAny = true;
        }

        if (!capturedAny) {
            const message = buildExportErrorMessage('pdf', filename, EXPORT_NO_ELEMENTS_DETAIL);
            console.error(message);
            logExportError('pdf', filename, EXPORT_NO_ELEMENTS_DETAIL);
            recordExport({ filename, format: 'pdf', status: 'failure', source });
            return false;
        }

        pdf.save(`${filename}.pdf`);
        recordExport({ filename, format: 'pdf', status: 'success', source });
        return true;
    } catch (err) {
        console.error('Multi-page PDF export failed:', err);
        logExportError('pdf', filename, err);
        recordExport({ filename, format: 'pdf', status: 'failure', source });
        return false;
    } finally {
        setIsExporting?.(false);
    }
}
