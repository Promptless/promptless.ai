import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { proxyLeaderboard } from "../lib/bingo/leaderboard-proxy";

export const prerender = false;
export const GET: APIRoute = () =>
  proxyLeaderboard({
    base: getSecret("BINGO_API_BASE_URL"),
    secret: getSecret("BINGO_PROXY_SECRET"),
    production: import.meta.env.PROD,
  });
