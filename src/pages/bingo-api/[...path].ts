import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { proxyBingo } from "../../lib/bingo/proxy";

export const prerender = false;
export const ALL: APIRoute = (context) =>
  proxyBingo(context, {
    base: getSecret("BINGO_API_BASE_URL"),
    secret: getSecret("BINGO_PROXY_SECRET"),
    production: import.meta.env.PROD,
  });
