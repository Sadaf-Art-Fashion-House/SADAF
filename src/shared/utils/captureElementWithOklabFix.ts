'use client';

import html2canvas from 'html2canvas';
import { normalizeUnsupportedColorFunctions } from './normalizeColors';

/**
 * captureElementWithOklabFix — a safe html2canvas wrapper.
 *
 * Tailwind CSS v4 emits `oklch()`/`oklab()` colors which html2canvas (v1.4.1)
 * cannot parse — it throws "Attempting to parse an unsupported color
 * function" and the export silently fails.
 *
 * Two layers of defense:
 * 1. `onclone` rewrites unsupported colors to hex inside the cloned snapshot
 *    (works reliably for HTML elements).
 * 2. For SVG elements (lucide icons, charts), Chrome computes alpha colors as
 *    `oklab()` and the clone's computed styles stay frozen after onclone
 *    rewrites their inline styles (a Chrome quirk in the offscreen clone
 *    iframe), so html2canvas still crashes. To prevent that, SVG colors are
 *    temporarily rewritten to hex in the SOURCE document before cloning —
 *    html2canvas then snapshots hex values and the crash never happens. The
 *    originals are restored in a `finally` block.
 *
 * Use this helper ANYWHERE a DOM element (chart, KPI card, watermark preview,
 * SVG preview…) is captured with html2canvas — never call html2canvas
 * directly, otherwise the oklab crash comes back.
 */

const UNSUPPORTED_COLOR_FUNCTION_TEST = /(?<![\w-])(?:oklch|oklab|lab|lch|color)\([^)]*\)/i;
const UNSUPPORTED_COLOR_FUNCTION_GLOBAL = /(?<![\w-])(?:oklch|oklab|lab|lch|color)\([^)]*\)/gi;

/**
 * Shared 1×1 canvas used to sample colors — exports run on the main thread
 * and converting hundreds of colors each allocating a fresh canvas would add
 * avoidable GC churn during an already heavy operation.
 */
let sharedSampleCanvas: HTMLCanvasElement | null = null;

function getSampleCanvas(): HTMLCanvasElement | null {
    if (!sharedSampleCanvas) {
        sharedSampleCanvas = document.createElement('canvas');
        sharedSampleCanvas.width = 1;
        sharedSampleCanvas.height = 1;
    }
    return sharedSampleCanvas;
}

/** Neutral substitute used when a color cannot be sampled — keeps the export from crashing. */
const FALLBACK_HEX = '#000000';

/** SVG presentation properties that can carry a color html2canvas must parse. */
const SVG_COLOR_PROPERTIES = ['color', 'stroke', 'fill'] as const;

/**
 * Convert any CSS color value (e.g. `oklab(0.74 0.001 0.117 / 0.5)`) to hex by
 * sampling a 1×1 canvas pixel. Returns null when the browser cannot parse it.
 */
function colorFunctionToHex(colorFunction: string): string | null {
    try {
        // willReadFrequently: this canvas is only ever used for color sampling.
        const context = getSampleCanvas()?.getContext('2d', { willReadFrequently: true });
        if (!context) return null;
        context.fillStyle = colorFunction;
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
        const toByte = (value: number) => value.toString(16).padStart(2, '0');
        const rgb = `#${toByte(red)}${toByte(green)}${toByte(blue)}`;
        return alpha >= 255 ? rgb : `${rgb}${toByte(alpha)}`;
    } catch {
        return null;
    }
}

/**
 * Rewrite unsupported color functions to hex inside a value; a value that
 * cannot be sampled falls back to a neutral hex (with a warning) rather than
 * leaving the unsupported function in place — which would make html2canvas
 * crash the whole export.
 */
function rewriteUnsupportedColors(value: string): string {
    return value.replace(UNSUPPORTED_COLOR_FUNCTION_GLOBAL, (colorFunction) => {
        const hex = colorFunctionToHex(colorFunction);
        if (hex) return hex;
        console.warn(`[capture] could not convert color "${colorFunction}" — using ${FALLBACK_HEX}`);
        return FALLBACK_HEX;
    });
}

interface SvgStylePatch {
    element: SVGElement;
    property: string;
    previousValue: string;
}

interface SvgColorPatches {
    /** Inline color property changes to revert. */
    stylePatches: SvgStylePatch[];
    /** Original inline `transition` per element — recorded/restored ONCE per element. */
    transitions: Map<SVGElement, string>;
}

/**
 * Rewrite unsupported modern colors on every SVG element inside `root` to hex
 * (inline styles), so html2canvas snapshots hex instead of oklab/oklch/lab.
 *
 * CSS transitions are disabled while patching: an icon with
 * `transition-colors` would otherwise keep reporting its old (unsupported)
 * computed color for the transition duration, and html2canvas copies that
 * frozen oklab value into its clone — recreating the exact crash we prevent.
 * The transition is captured once per element (not per property) so an icon
 * patched on both `color` and `stroke` restores its original transition
 * instead of being left with a permanent inline `transition: none`.
 */
function patchSvgColors(root: HTMLElement): SvgColorPatches {
    const stylePatches: SvgStylePatch[] = [];
    const transitions = new Map<SVGElement, string>();

    for (const element of Array.from(root.querySelectorAll('svg, svg *'))) {
        if (!(element instanceof SVGElement)) continue;

        const computedStyle = getComputedStyle(element);
        let patchedAnyProperty = false;

        for (const property of SVG_COLOR_PROPERTIES) {
            const computedValue = computedStyle.getPropertyValue(property);
            if (!computedValue || !UNSUPPORTED_COLOR_FUNCTION_TEST.test(computedValue)) {
                continue;
            }

            const rewrittenValue = rewriteUnsupportedColors(computedValue);
            if (rewrittenValue === computedValue) continue;

            const previousValue = element.style.getPropertyValue(property);
            element.style.setProperty(property, rewrittenValue);
            stylePatches.push({ element, property, previousValue });
            patchedAnyProperty = true;
        }

        if (patchedAnyProperty && !transitions.has(element)) {
            transitions.set(element, element.style.getPropertyValue('transition'));
            element.style.setProperty('transition', 'none');
        }
    }

    return { stylePatches, transitions };
}

/** Restore the inline styles recorded by patchSvgColors (an empty value removes the inline). */
function restoreSvgColors(patches: SvgColorPatches): void {
    for (const patch of patches.stylePatches) {
        patch.element.style.setProperty(patch.property, patch.previousValue);
    }
    for (const [element, previousTransition] of patches.transitions) {
        element.style.setProperty('transition', previousTransition);
    }
}

/**
 * Temporarily add uniform breathing room around the captured element so
 * content that is flush to its edges (e.g. a chart's axis labels on the
 * left/right or its Total amount at the bottom) is never clipped by
 * html2canvas's exact-bounds capture — which cuts ~1-2px off any side where
 * content touches the element boundary.
 *
 * The element's border-box width is pinned (so internal 100%-width wrappers
 * like recharts' ResponsiveContainer do NOT re-layout) and `content-box`
 * box-sizing is forced, so the content itself keeps its exact position while
 * `padding` extends the border-box around it. All original inline values are
 * restored by the caller afterwards.
 */
interface CapturePaddingState {
    width: string;
    maxWidth: string;
    minWidth: string;
    boxSizing: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
}

const CAPTURE_SAFE_PADDING_PX = 12;

function applyCapturePadding(element: HTMLElement): CapturePaddingState {
    const state: CapturePaddingState = {
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        minWidth: element.style.minWidth,
        boxSizing: element.style.boxSizing,
        paddingTop: element.style.paddingTop,
        paddingRight: element.style.paddingRight,
        paddingBottom: element.style.paddingBottom,
        paddingLeft: element.style.paddingLeft,
    };

    element.style.boxSizing = 'content-box';
    element.style.width = `${Math.ceil(element.getBoundingClientRect().width)}px`;
    // A `max-width`/`min-width` (common in responsive Tailwind layouts) would
    // clamp the pinned border-box width, silently shrinking the content box
    // and re-triggering the internal re-layout the width pinning prevents.
    element.style.maxWidth = 'none';
    element.style.minWidth = 'none';
    element.style.paddingTop = `${CAPTURE_SAFE_PADDING_PX}px`;
    element.style.paddingRight = `${CAPTURE_SAFE_PADDING_PX}px`;
    element.style.paddingBottom = `${CAPTURE_SAFE_PADDING_PX}px`;
    element.style.paddingLeft = `${CAPTURE_SAFE_PADDING_PX}px`;
    // Force a synchronous reflow so the capture reads post-padding geometry.
    void element.offsetHeight;

    return state;
}

function restoreCapturePadding(element: HTMLElement, state: CapturePaddingState): void {
    element.style.width = state.width;
    element.style.maxWidth = state.maxWidth;
    element.style.minWidth = state.minWidth;
    element.style.boxSizing = state.boxSizing;
    element.style.paddingTop = state.paddingTop;
    element.style.paddingRight = state.paddingRight;
    element.style.paddingBottom = state.paddingBottom;
    element.style.paddingLeft = state.paddingLeft;
}

/**
 * html2canvas clones the ENTIRE document (not just the captured element) and
 * runs ~3 getComputedStyle calls per element, so a big page adds ~15s of
 * fixed overhead to EVERY capture — independent of the captured element's
 * size. html2canvas skips elements carrying the `data-html2canvas-ignore`
 * attribute, so everything outside the captured element (and its ancestor
 * chain, which must stay for the reference lookup) is temporarily marked and
 * restored after the capture. The captured element's own computed styles are
 * inlined by inlineComputedStyles, so the missing siblings never affect the
 * layout.
 */
const IGNORE_ATTRIBUTE = 'data-html2canvas-ignore';

interface IgnoreMarkState {
    element: Element;
}

function markPageOutsideCapture(element: HTMLElement): IgnoreMarkState[] {
    const marked: IgnoreMarkState[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
        // Keep the captured element, its subtree, and its ancestor chain.
        if (el === element || element.contains(el) || el.contains(element)) continue;
        if (el.hasAttribute(IGNORE_ATTRIBUTE)) continue;
        el.setAttribute(IGNORE_ATTRIBUTE, '');
        marked.push({ element: el });
    }
    return marked;
}

function restoreIgnoreMarks(marks: IgnoreMarkState[]): void {
    for (const mark of marks) {
        mark.element.removeAttribute(IGNORE_ATTRIBUTE);
    }
}

/**
 * Keep the capture sharp on screen but bounded: html2canvas render cost grows
 * with the square of the scale, and very wide elements (user's ~1400px
 * viewport → 2800px canvas at 2x) are by far the slowest. Cap the longest
 * canvas side at MAX_CANVAS_DIM px (never below 1×, so text stays legible on
 * ultra-wide elements) — small elements keep the full base scale. Any
 * caller-provided `scale` is treated as an upper bound.
 */
const MAX_CANVAS_DIM = 2048;

function computeCaptureScale(element: HTMLElement, baseScale: number): number {
    const rect = element.getBoundingClientRect();
    const longestSide = Math.max(rect.width, rect.height);
    if (longestSide <= 0) return baseScale;
    // Floor of 1×: for elements wider than MAX_CANVAS_DIM the canvas still
    // exceeds the cap, but sub-1× scaling would blur text beyond usefulness.
    return Math.min(baseScale, Math.max(1, MAX_CANVAS_DIM / longestSide));
}

/**
 * Copy the SOURCE computed styles of every element in `sourceRoot` onto the
 * matching element in `clonedRoot` (the html2canvas clone) as inline styles.
 *
 * html2canvas only inlines computed styles for SVG elements (or with
 * `foreignObjectRendering`). HTML layout in the clone therefore depends on the
 * clone's stylesheets loading in time — when they don't (intermittent in Next
 * dev), fixed-height wrappers like `h-56` collapse and the captured chart
 * comes out as a squished horizontal strip. Inlining the computed styles
 * makes the clone layout deterministic and identical to the live page.
 *
 * Both trees are 1:1 copies, so `querySelectorAll('*')` yields the same
 * elements in the same document order.
 */
function inlineComputedStyles(sourceRoot: HTMLElement, clonedRoot: HTMLElement): void {
    const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll('*'))];
    const clonedElements = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];

    const length = Math.min(sourceElements.length, clonedElements.length);
    for (let i = 0; i < length; i++) {
        const sourceStyle = getComputedStyle(sourceElements[i]);
        // Both HTMLElement and SVGElement expose `.style`; Element alone does not.
        const clonedElement = clonedElements[i] as HTMLElement;
        for (let p = 0; p < sourceStyle.length; p++) {
            const property = sourceStyle.item(p);
            // Never copy transitions or animations into the clone: a clone
            // element that gets an inline color change while carrying a
            // transition/animation would keep its computed color frozen at the
            // old (unsupported oklab) value — html2canvas parses computed
            // styles immediately after onclone and crashes. The export is a
            // static snapshot, so the clone must not animate anything.
            if (property.startsWith('transition') || property.startsWith('animation')) continue;
            const value = sourceStyle.getPropertyValue(property);
            // html2canvas cannot parse modern color functions (oklab/oklch/
            // lab/lch) in ANY property — rewrite them to hex so the inline
            // styles never carry a value that makes the parser crash.
            if (value && UNSUPPORTED_COLOR_FUNCTION_TEST.test(value)) {
                clonedElement.style.setProperty(property, rewriteUnsupportedColors(value));
            } else {
                clonedElement.style.setProperty(property, value);
            }
        }
    }
}

export async function captureElementWithOklabFix(
    element: HTMLElement,
    options: {
        backgroundColor?: string;
        scale?: number;
    } = {},
): Promise<HTMLCanvasElement> {
    const { backgroundColor = '#0A0F2C', scale = 2 } = options;

    // onclone resolves the cloned root via `getElementById` — guarantee the
    // element has an id so inlineComputedStyles never silently skips (which
    // would bring the squished-layout bug back for id-less elements).
    const hadId = Boolean(element.id);
    if (!hadId) element.id = `sadaf-capture-${Date.now()}`;

    const svgColorPatches = patchSvgColors(element);
    const paddingState = applyCapturePadding(element);
    // Dynamic scale is computed AFTER padding (the padded box is what is captured).
    const effectiveScale = computeCaptureScale(element, scale);
    const ignoreMarks = markPageOutsideCapture(element);

    try {
        const canvas = await html2canvas(element, {
            backgroundColor,
            scale: effectiveScale,
            useCORS: true,
            logging: false,
            allowTaint: false,
            onclone: (documentClone) => {
                const clonedElement = documentClone.getElementById(element.id);
                if (clonedElement) {
                    inlineComputedStyles(element, clonedElement);
                }
                normalizeUnsupportedColorFunctions(documentClone);
            },

        });
        return canvas;
    } finally {
        restoreSvgColors(svgColorPatches);
        restoreCapturePadding(element, paddingState);
        restoreIgnoreMarks(ignoreMarks);
        if (!hadId) element.removeAttribute('id');
    }
}
