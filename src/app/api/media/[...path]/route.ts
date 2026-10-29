import { NextResponse, type NextRequest } from 'next/server';
import { getSadafApiTimeoutMs, getSadafApiUrl } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

const FORWARDED_HEADERS = ['content-type', 'content-length', 'etag', 'last-modified'];
const ALLOWED_MEDIA_PREFIXES = [
    'web/image/product.template/',
    'web/image/sadaf.collection/',
    'web/image/sadaf.lookbook.item/',
];

function encodePath(segments: string[]): string | null {
    if (segments.length === 0) return null;

    const encoded: string[] = [];
    for (const segment of segments) {
        if (!segment || segment === '.' || segment === '..' || segment.length > 200) {
            return null;
        }
        encoded.push(encodeURIComponent(segment));
    }
    return encoded.join('/');
}

/**
 * Same-origin image proxy. Only catalog image fields on the SADAF/product
 * models are allowed; attachments, database manager routes, JSON-RPC, and
 * unrelated Odoo models are deliberately excluded.
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    const encodedPath = encodePath(path);

    if (
        !encodedPath ||
        !ALLOWED_MEDIA_PREFIXES.some((prefix) => encodedPath.startsWith(prefix))
    ) {
        return new NextResponse('Not found', { status: 404 });
    }

    const target = `${getSadafApiUrl()}/${encodedPath}${request.nextUrl.search}`;
    const controller = new AbortController();
    // Odoo may generate a resized image on first request; give media a little
    // more headroom than JSON API calls.
    const timeout = setTimeout(
        () => controller.abort(),
        Math.max(getSadafApiTimeoutMs(), 30_000),
    );

    try {
        const upstream = await fetch(target, {
            cache: 'no-store',
            redirect: 'manual',
            signal: controller.signal,
        });

        if (!upstream.ok) {
            return new NextResponse('Not found', { status: upstream.status === 404 ? 404 : 502 });
        }

        const headers = new Headers();
        for (const name of FORWARDED_HEADERS) {
            const value = upstream.headers.get(name);
            if (value) headers.set(name, value);
        }

        if (!headers.has('cache-control')) {
            headers.set('cache-control', 'public, max-age=60, stale-while-revalidate=300');
        }

        return new NextResponse(await upstream.arrayBuffer(), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error(
            '[sadaf:media] proxy failed:',
            error instanceof Error ? error.message : 'unknown error',
        );
        return new NextResponse('Image unavailable', { status: 502 });
    } finally {
        clearTimeout(timeout);
    }
}
