/**
 * SADAF | AI Studio — Seeded procedural pattern fallback
 *
 * When the Gemini/Imagen pipeline is unreachable (no API key, quota, or
 * network error), `generateFallbackPattern` produces a deterministic
 * geometric SVG seeded from the prompt + colors — so a "generated" design
 * still looks unique and on-brand instead of always showing the same static
 * placeholder. Same seed → same pattern, so the preview is stable across
 * re-renders.
 */

/** FNV-1a string hash → stable 32-bit seed. */
function hashString(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/** mulberry32 — tiny deterministic PRNG. */
function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Build a `points` attribute for a regular n-point star. */
function starPoints(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    points: number
): string {
    const coordinates: string[] = [];
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / points) * i - Math.PI / 2;
        coordinates.push(
            `${(centerX + radius * Math.cos(angle)).toFixed(2)},${(centerY + radius * Math.sin(angle)).toFixed(2)}`
        );
    }
    return coordinates.join(' ');
}

export function generateFallbackPattern(
    prompt: string,
    primaryColor: string,
    accentColor: string
): string {
    const random = mulberry32(hashString(`${prompt}|${primaryColor}|${accentColor}`));
    const shapes: string[] = [];

    const motifCount = 5 + Math.floor(random() * 4);
    for (let i = 0; i < motifCount; i++) {
        const centerX = 10 + random() * 80;
        const centerY = 10 + random() * 80;
        const outerRadius = 6 + random() * 13;
        const rotation = random() * 360;
        const kind = Math.floor(random() * 3);

        if (kind === 0) {
            const points = 4 + Math.floor(random() * 3);
            shapes.push(
                `<polygon points="${starPoints(centerX, centerY, outerRadius, outerRadius * 0.45, points)}" fill="none" stroke="${accentColor}" stroke-width="${(0.5 + random()).toFixed(2)}" transform="rotate(${rotation.toFixed(1)} ${centerX.toFixed(2)} ${centerY.toFixed(2)})"/>`
            );
        } else if (kind === 1) {
            shapes.push(
                `<circle cx="${centerX.toFixed(2)}" cy="${centerY.toFixed(2)}" r="${outerRadius.toFixed(2)}" fill="none" stroke="${i % 2 === 0 ? accentColor : primaryColor}" stroke-width="${(0.4 + random()).toFixed(2)}" stroke-dasharray="${(2 + random() * 2).toFixed(1)},${(1 + random() * 2).toFixed(1)}"/>`
            );
        } else {
            const side = (outerRadius * 1.6).toFixed(2);
            shapes.push(
                `<rect x="${(centerX - outerRadius * 0.8).toFixed(2)}" y="${(centerY - outerRadius * 0.8).toFixed(2)}" width="${side}" height="${side}" fill="none" stroke="${accentColor}" stroke-width="${(0.4 + random()).toFixed(2)}" transform="rotate(${rotation.toFixed(1)} ${centerX.toFixed(2)} ${centerY.toFixed(2)})"/>`
            );
        }
    }

    return `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${primaryColor}"/>
  <circle cx="50" cy="50" r="46" stroke="${accentColor}" stroke-width="0.6" stroke-dasharray="2,3" opacity="0.6"/>
  ${shapes.join('\n  ')}
</svg>`;
}
