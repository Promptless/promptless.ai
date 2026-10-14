import { next, rewrite } from '@vercel/edge';

export default function middleware(request: Request) {
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/markdown')) return next();

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  // Already has a file extension — pass through
  if (/\.[a-z0-9]+$/i.test(pathname)) return next();

  // Rewrite to the pre-built .md variant
  url.pathname = pathname === '/' ? '/index.md' : `${pathname}.md`;
  return rewrite(url);
}

export const config = {
  matcher: ['/', '/demo', '/pricing', '/free-tools', '/free-tools/:path*', '/docs/:path*', '/blog/:path*', '/changelog/:path*'],
};
