import { getSadafApiTimeoutMs, getSadafApiUrl } from './config';
import { SadafApiError } from './errors';

/**
 * Small server-side HTTP client for Odoo's `/api/v1` endpoints.
 *
 * Every call is uncached: catalog data is edited in Odoo and must be reflected
 * on the storefront immediately. The timeout protects page rendering from a
 * hung backend.
 */
export async function sadafFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (typeof window !== 'undefined') {
        throw new Error('sadafFetch is server-only. Use the /api/sadaf BFF from browser code.');
    }

    const base = getSadafApiUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getSadafApiTimeoutMs());

    try {
        const response = await fetch(`${base}${normalizedPath}`, {
            ...init,
            cache: 'no-store',
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                ...init.headers,
            },
        });

        if (!response.ok) {
            let message = `Odoo request failed (${response.status}).`;
            let details: unknown;

            try {
                details = await response.json();
                if (details && typeof details === 'object') {
                    const candidate = details as Record<string, unknown>;
                    if (typeof candidate.error === 'string') message = candidate.error;
                    if (typeof candidate.message === 'string') message = candidate.message;
                }
            } catch {
                // Keep the generic message when Odoo does not return JSON.
            }

            throw new SadafApiError(message, response.status, 'odoo_error', details);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof SadafApiError) throw error;

        if (error instanceof Error && error.name === 'AbortError') {
            throw new SadafApiError('The catalog service timed out.', 504, 'timeout');
        }

        throw new SadafApiError('The catalog service is unavailable.', 502, 'network_error');
    } finally {
        clearTimeout(timeout);
    }
}
