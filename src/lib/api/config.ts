/**
 * Server-only configuration for the SADAF Odoo API.
 *
 * Never expose this URL through a NEXT_PUBLIC_* variable. Browser code must
 * talk to the Next.js BFF (`/api/sadaf/*`), not directly to Odoo.
 */

export function getSadafApiUrl(): string {
    const value = process.env.SADAF_API_URL?.trim();

    if (!value) {
        throw new Error(
            'SADAF_API_URL is not configured. Set it to the Odoo origin, e.g. http://127.0.0.1:8070.',
        );
    }

    return value.replace(/\/+$/, '');
}

export function getSadafApiTimeoutMs(): number {
    const parsed = Number(process.env.SADAF_API_TIMEOUT_MS ?? 15_000);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15_000;
}
