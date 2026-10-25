import type { APIRoute } from "astro";
import { proxyBingo } from "../../lib/bingo/proxy";

export const prerender = false;
export const ALL: APIRoute = (context) => proxyBingo(context, {
  base: process.env.BINGO_API_BASE_URL,
  secret: process.env.BINGO_PROXY_SECRET,
  production: import.meta.env.PROD,
});
