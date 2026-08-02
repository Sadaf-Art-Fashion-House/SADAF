'use client';

/**
 * html2canvas (v1.4.1) only understands hex colors, named colors and the
 * classic rgb()/rgba()/hsl()/hsla() functions. Tailwind CSS v4 generates its
 * default palette in the modern `oklch()` color space, so html2canvas throws
 * "Attempting to parse an unsupported color function" and the whole export
 * silently fails.
 *
 * This module rewrites every unsupported color function found in the cloned
 * document (the snapshot html2canvas rasterizes) into an `#rrggbb` /
 * `#rrggbbaa` hex equivalent. The conversion is done through the browser's
 * own color engine via a 1×1 canvas pixel readback, which is pixel-accurate
 * and immune to serialization-format differences.
 *
 * Shared by the Analytics Dashboard exports and the Watermark Settings
 * preview/export flows — see `captureElementWithOklabFix` for the ready-made
 * html2canvas wrapper.
 */

/** Longhand CSS properties that can carry colors html2canvas must parse. */
const COLOR_STYLE_PROPERTIES = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'caret-color',
    'column-rule-color',
    'fill',
    'stroke',
    'box-shadow',
    'text-shadow',
    'background-image',
] as const;

/** Detects any modern CSS color function (no global flag — safe for .test()). */
const UNSUPPORTED_COLOR_FUNCTION_TEST = /(?<![\w-])(?:oklch|oklab|lab|lch|color)\([^)]*\)/i;

/** Same pattern with the global flag for String.replace(). */
const UNSUPPORTED_COLOR_FUNCTION_GLOBAL = /(?<![\w-])(?:oklch|oklab|lab|lch|color)\([^)]*\)/gi;

/**
 * Convert any CSS color value (e.g. `oklch(0.7 0.1 150 / 0.5)`) to a hex
 * string by sampling a 1×1 canvas pixel. Returns null when the value cannot
 * be parsed by the browser.
 */
function colorValueToHex(colorValue: string): string | null {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        if (!context) return null;

        context.clearRect(0, 0, 1, 1);
        context.fillStyle = '#000000';
        context.fillStyle = colorValue;
        context.fillRect(0, 0, 1, 1);

        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
        return toHexColor(red, green, blue, alpha / 255);
    } catch {
        return null;
    }
}

/** Pack RGBA channels into an #rrggbb or #rrggbbaa hex string. */
function toHexColor(red: number, green: number, blue: number, alpha: number): string {
    const toByte = (value: number) => value.toString(16).padStart(2, '0');
    const rgb = `#${toByte(red)}${toByte(green)}${toByte(blue)}`;
    return alpha >= 0.999 ? rgb : `${rgb}${toByte(Math.round(alpha * 255))}`;
}

/**
 * Walk every element of the cloned document and rewrite color-bearing style
 * properties so they only contain values html2canvas understands. Run this
 * inside html2canvas' `onclone` hook, before the snapshot is rasterized.
 */
export function normalizeUnsupportedColorFunctions(documentClone: Document): void {
    const elements = documentClone.querySelectorAll('*');

    for (const element of Array.from(elements)) {
        const htmlElement = element as HTMLElement;
        const style = htmlElement.style;
        if (!style) continue;

        const computedStyle = documentClone.defaultView?.getComputedStyle(htmlElement);
        if (!computedStyle) continue;

        for (const property of COLOR_STYLE_PROPERTIES) {
            const computedValue = computedStyle.getPropertyValue(property);
            if (!computedValue || !UNSUPPORTED_COLOR_FUNCTION_TEST.test(computedValue)) {
                continue;
            }

            const rewrittenValue = computedValue.replace(
                UNSUPPORTED_COLOR_FUNCTION_GLOBAL,
                (colorFunction) => colorValueToHex(colorFunction) ?? colorFunction,
            );

            if (rewrittenValue !== computedValue) {
                try {
                    style.setProperty(property, rewrittenValue);
                } catch {
                    // A single malformed value must never break the whole capture.
                }
            }
        }
    }
}
