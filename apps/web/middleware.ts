import { NextRequest, NextResponse } from 'next/server';

/**
 * Host-aware routing for the multi-site Web Studio.
 *
 * Requests arriving on the main app host (the ERP dashboard/auth) are served
 * normally. Requests on any other host are treated as a published tenant
 * website and rewritten into the `/_sites/<host>/...` renderer, which resolves
 * the site by its custom domain and serves its pages from "/".
 */
const APP_HOSTS = new Set(
  ['localhost', '127.0.0.1', '0.0.0.0', process.env.NEXT_PUBLIC_APP_HOST]
    .filter(Boolean)
    .map((h) => (h as string).toLowerCase()),
);

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostHeader = req.headers.get('host') || '';
  const hostname = (hostHeader.split(':')[0] || hostHeader).toLowerCase();

  // Main app host → normal dashboard/auth/app routing.
  if (APP_HOSTS.has(hostname)) return NextResponse.next();

  // Any other host → published site. Rewrite into the site renderer.
  const rewritten = url.clone();
  const suffix = url.pathname === '/' ? '' : url.pathname;
  rewritten.pathname = `/_sites/${hostname}${suffix}`;
  return NextResponse.rewrite(rewritten);
}

export const config = {
  // Skip API, Next internals, static assets, and the site renderer itself.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|_sites).*)'],
};
