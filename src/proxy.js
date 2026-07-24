import { NextResponse } from 'next/server';

// Paths that should always be proxied to the backend regardless of format
const PROXY_PATHS = ['/openapi'];

/**
 * Proxy that handles OGC API content negotiation.
 * The Next.js frontend only serves HTML. All other formats are proxied
 * to the pygeoapi backend. This covers ?f=json, ?f=csv, ?f=jsonld,
 * as well as Accept-header based negotiation (e.g. QGIS, curl).
 *
 * A request is served by Next.js only when:
 * - No ?f= parameter is set (or ?f=html), AND
 * - The Accept header includes text/html (or is missing/wildcard)
 */
export function proxy(request) {
  const { searchParams, pathname } = request.nextUrl;
  const format = searchParams.get('f');

  const isProxyPath = PROXY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isNonHtmlFormat = format && format.toLowerCase() !== 'html';
  const acceptHeaderRaw = request.headers.get('accept');
  const acceptHeader = (acceptHeaderRaw || '').toLowerCase();
  const wantsHtml =
    !acceptHeaderRaw || acceptHeader.includes('text/html') || acceptHeader.trim() === '*/*';
  const requestsNonHtmlAccept = !wantsHtml;

  if (!isProxyPath && !isNonHtmlFormat && !requestsNonHtmlAccept) {
    return NextResponse.next();
  }

  const apiBaseUrl = (process.env.API_BASE_URL || '').trim();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: 'API_BASE_URL is not configured' },
      { status: 500 }
    );
  }

  const backendUrl = new URL(pathname, apiBaseUrl.replace(/\/+$/, ''));

  // Forward all query parameters to the backend
  searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  return NextResponse.rewrite(backendUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - api/ (API routes)
     * - favicon.ico, gfx/ (static assets)
     */
    '/((?!_next/static|_next/image|api/|favicon\\.ico|gfx/).*)',
  ],
};
