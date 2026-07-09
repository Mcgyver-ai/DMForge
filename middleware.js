import { NextResponse } from 'next/server'

// ponytail: cookie is a redirect hint, not a security boundary — Firebase Admin token
// verification in every API route is the real enforcement. Upgrade to verified session
// cookies (firebase-admin on Node runtime) when SSR data leakage becomes a concern.
export function middleware(req) {
  if (!req.cookies.get('dmforge-auth')) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/inbox/:path*', '/settings/:path*', '/billing/:path*'],
}
