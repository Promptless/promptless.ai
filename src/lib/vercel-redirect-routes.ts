/**
 * Trailing-slash tolerance for the redirect routes @astrojs/vercel writes to
 * `.vercel/output/config.json`. scripts/normalize-vercel-redirects.ts applies
 * it after every adapter build.
 *
 * The adapter serializes each Astro redirect as an exact-match regex such as
 * `^/docs/getting-started/welcome$`, without Astro's default optional trailing
 * slash. The earlier docs sites published trailing-slash URLs, and search
 * engines still index them, so every redirect source must also match with one
 * trailing slash.
 */

export interface VercelRoute {
  src?: string;
  status?: number;
  headers?: Record<string, string>;
}

/** True for a generated redirect: a 3xx status with a Location header. */
export function isRedirectRoute(route: VercelRoute): boolean {
  return Boolean(
    route.src && route.headers?.Location && route.status && route.status >= 300 && route.status < 400
  );
}

/**
 * Let an anchored source regex match with or without one trailing slash.
 *
 * `^/docs/audit$` becomes `^/docs/audit/?$`. A source that already ends in
 * `/$` or `/?$` is normalized to `/?$`, so the function is idempotent.
 */
export function allowTrailingSlash(src: string): string {
  if (!src.startsWith('^/') || !src.endsWith('$')) {
    throw new Error(`Expected an anchored redirect source regex, got ${src}.`);
  }
  return src.replace(/\/?(?:\/\?)?\$$/, '/?$');
}

/**
 * Make every redirect route slash-tolerant, in place, and return how many
 * redirect routes there were.
 *
 * The dynamic `/api/[...slug]` redirect also gets a slash-terminated Location:
 * Starlight's generated OpenAPI pages declare slash-terminated canonicals, and
 * the adapter drops the trailing slash from dynamic destinations.
 */
export function normalizeRedirectRoutes(routes: VercelRoute[]): number {
  let redirectCount = 0;
  for (const route of routes) {
    if (!isRedirectRoute(route)) continue;
    route.src = allowTrailingSlash(route.src!);
    const location = route.headers!.Location;
    if (route.src.startsWith('^/api(?:') && !location.endsWith('/')) {
      route.headers!.Location = `${location}/`;
    }
    redirectCount += 1;
  }
  return redirectCount;
}
