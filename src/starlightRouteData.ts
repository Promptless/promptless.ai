import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { dedupeOverviewTocItem } from './lib/toc-overview';

// Show "Overview" once in "On this page" on pages that open with an
// `## Overview` heading. See src/lib/toc-overview.ts.
export const onRequest = defineRouteMiddleware((context) => {
  const { toc } = context.locals.starlightRoute;
  if (toc) toc.items = dedupeOverviewTocItem(toc.items);
});
