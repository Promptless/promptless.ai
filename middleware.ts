import { next, rewrite } from '@vercel/edge';

export default function middleware(request: Request) {
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/markdown')) return next();

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  // Already has a file extension — pass through. Agent Score report paths end
  // in a hostname (/agent-score/docs.stripe.com), so there only `.md` and
  // `/og.png` count as extensions.
  const isAgentScoreReport = pathname.startsWith('/agent-score/');
  if (isAgentScoreReport ? /(\.md|\/og\.png)$/i.test(pathname) : /\.[a-z0-9]+$/i.test(pathname)) return next();

  // Rewrite to the pre-built (or, for Agent Score reports, on-demand) .md variant
  url.pathname = pathname === '/' ? '/index.md' : `${pathname}.md`;
  return rewrite(url);
}

export const config = {
  matcher: [
    '/',
    '/demo',
    '/pricing',
    '/free-tools',
    '/free-tools/:path*',
    '/agent-score',
    '/agent-score/:path*',
    '/guides/:path*',
    '/docs/:path*',
    '/blog/:path*',
    '/changelog/:path*',
  ],
};
