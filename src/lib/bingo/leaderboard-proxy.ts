import { leaderboardSchema } from "./leaderboard";
import { bingoUpstream, type ProxyConfig } from "./proxy";

const MAX_RESPONSE_BYTES = 256 * 1024;
const unavailable = () =>
  Response.json(
    {
      detail:
        "The leaderboard is temporarily unavailable. Try again in a minute.",
    },
    {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    },
  );

/** Publish only the validated anonymous projection; never forward cookies or upstream errors. */
export async function proxyLeaderboard(config: ProxyConfig): Promise<Response> {
  const upstream = bingoUpstream(config);
  if (!upstream || !config.secret || config.secret.length < 32)
    return unavailable();
  try {
    const response = await fetch(
      `${upstream.href.replace(/\/$/, "")}/leaderboard`,
      {
        headers: { "X-Bingo-Proxy-Key": config.secret },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok || !response.body) return unavailable();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return unavailable();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const data = leaderboardSchema.parse(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=30, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return unavailable();
  }
}
