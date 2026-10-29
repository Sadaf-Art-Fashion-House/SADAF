import { NextResponse, type NextRequest } from 'next/server';
import { getSadafApiTimeoutMs, getSadafApiUrl } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'cookie'];
const FORWARDED_RESPONSE_HEADERS = [
    'cache-control',
    'content-language',
    'content-type',
    'etag',
    'last-modified',
    'vary',
];
const MAX_BODY_BYTES = 1_000_000;

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

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

function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (origin) {
        const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
        const protocol =
            request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ??
            request.nextUrl.protocol.replace(':', '');
        const expectedOrigin = host ? `${protocol}://${host}` : request.nextUrl.origin;

        if (origin !== request.nextUrl.origin && origin !== expectedOrigin) {
            return false;
        }
    }

    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
        return false;
    }

    return true;
}

function sanitizeCookie(cookie: string, secure: boolean): string {
    let value = cookie.replace(/;\s*Domain=[^;]*/gi, '');

    if (secure) {
        if (!/;\s*Secure\b/i.test(value)) value += '; Secure';
    } else {
        value = value.replace(/;\s*Secure\b/gi, '');
    }

    if (!/;\s*Path=/i.test(value)) value += '; Path=/';
    if (!/;\s*SameSite=/i.test(value)) value += '; SameSite=Lax';

    return value;
}

function setCookiesFrom(response: Response): string[] {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];

    if (cookies.length > 0) return cookies;

    const single = response.headers.get('set-cookie');
    return single ? [single] : [];
}

export async function GET(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
    if (!isSameOrigin(request)) {
        return jsonError('Cross-origin request rejected.', 403);
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return jsonError('Request body is too large.', 413);
    }

    const { path } = await context.params;
    const encodedPath = encodePath(path);
    if (!encodedPath) {
        return jsonError('Invalid API path.', 400);
    }

    const target = `${getSadafApiUrl()}/api/v1/${encodedPath}${request.nextUrl.search}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getSadafApiTimeoutMs());

    try {
        const headers = new Headers();
        for (const name of FORWARDED_REQUEST_HEADERS) {
            const value = request.headers.get(name);
            if (value) headers.set(name, value);
        }

        const method = request.method.toUpperCase();
        const body =
            method === 'GET' || method === 'HEAD'
                ? undefined
                : await request.arrayBuffer();

        const upstream = await fetch(target, {
            method,
            headers,
            body,
            cache: 'no-store',
            redirect: 'manual',
            signal: controller.signal,
        });

        const responseHeaders = new Headers();
        for (const name of FORWARDED_RESPONSE_HEADERS) {
            const value = upstream.headers.get(name);
            if (value) responseHeaders.set(name, value);
        }

        const isHttps =
            request.nextUrl.protocol === 'https:' ||
            request.headers.get('x-forwarded-proto') === 'https';
        const secureCookie = process.env.SADAF_COOKIE_SECURE === 'true' || isHttps;
        for (const cookie of setCookiesFrom(upstream)) {
            responseHeaders.append('set-cookie', sanitizeCookie(cookie, secureCookie));
        }

        const hasBody = upstream.status !== 204 && upstream.status !== 304;
        const responseBody = hasBody ? await upstream.arrayBuffer() : null;

        return new NextResponse(responseBody, {
            status: upstream.status,
            headers: responseHeaders,
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return jsonError('The catalog service timed out.', 504);
        }
        return jsonError('The catalog service is unavailable.', 502);
    } finally {
        clearTimeout(timeout);
    }
}
