import type { APIRoute, GetStaticPaths } from 'astro';

// starlight-openapi injects concrete API pages, but Astro only accepts a
// configured dynamic redirect when its destination has a matching dynamic
// route declaration. This empty route supplies that declaration without
// emitting pages or shadowing the plugin's concrete output.
export const getStaticPaths: GetStaticPaths = () => [];

export const GET: APIRoute = () => new Response(null, { status: 404 });
