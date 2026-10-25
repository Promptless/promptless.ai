import type { APIContext } from "astro";

const COOKIE = "bingo_session";
const LIMIT = 1024 * 1024;
const privateHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const routes: Record<string, string[]> = {
  "email/code": ["POST"],
  "email/verify": ["POST"],
  session: ["GET", "DELETE"],
  board: ["GET", "POST", "DELETE"],
};
interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}
export type ProxyContext = Pick<
  APIContext,
  "request" | "url" | "params" | "clientAddress"
> & {
  cookies: {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options: CookieOptions): void;
    delete(name: string, options: { path: string }): void;
  };
};
export interface ProxyConfig {
  base?: string;
  secret?: string;
  production: boolean;
}
const error = (status: number, detail: string) =>
  Response.json({ detail }, { status, headers: privateHeaders });

export async function proxyBingo(
  context: ProxyContext,
  config: ProxyConfig,
): Promise<Response> {
  const { request, url, cookies } = context;
  const path = context.params.path || "";
  const methods = /^board\/photos\/[a-z0-9-]{1,64}$/.test(path)
    ? ["GET", "PUT", "DELETE"]
    : routes[path];
  if (!methods?.includes(request.method)) return error(404, "Not found.");
  if (!config.base || !config.secret || config.secret.length < 32)
    return error(
      503,
      "Saving across devices is not connected in this preview. Your board is saved on this device.",
    );
  let upstream: URL;
  try {
    upstream = new URL(config.base);
  } catch {
    return error(503, "Saving is not configured.");
  }
  if (
    upstream.username ||
    upstream.password ||
    upstream.search ||
    upstream.hash ||
    (upstream.protocol !== "https:" &&
      !(
        upstream.protocol === "http:" &&
        !config.production &&
        ["localhost", "127.0.0.1"].includes(upstream.hostname)
      ))
  ) {
    return error(503, "Saving is not configured.");
  }
  // SameSite is defense in depth. Every mutation also requires the exact browser origin.
  if (request.method !== "GET" && request.headers.get("Origin") !== url.origin)
    return error(403, "Open Bingo on this website to continue.");
  if (request.headers.get("Sec-Fetch-Site") === "cross-site")
    return error(403, "Open Bingo on this website to continue.");
  const headers = new Headers({ "X-Bingo-Proxy-Key": config.secret });
  const session = cookies.get(COOKIE)?.value;
  if (session) headers.set("Authorization", `Bearer ${session}`);
  if (path === "email/code")
    headers.set("X-Bingo-Client-IP", context.clientAddress);
  for (const name of ["Content-Type", "If-Match", "X-Bingo-Board"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let body: ArrayBuffer | undefined;
  if (request.body) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > (path.startsWith("board/photos/") ? LIMIT : 4096)) {
        await reader.cancel();
        return error(413, "That upload is too large.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    body = bytes.buffer;
  }
  let result: Response;
  try {
    result = await fetch(`${upstream.href.replace(/\/$/, "")}/${path}`, {
      method: request.method,
      headers,
      body,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(path === "email/code" ? 40_000 : 20_000),
    });
  } catch {
    return error(
      503,
      "Couldn’t reach saving right now. Your local board is safe.",
    );
  }
  const cookieOptions = {
    httpOnly: true,
    secure: config.production,
    sameSite: "lax" as const,
    path: "/bingo-api",
    maxAge: 30 * 86400,
  };
  if (result.status === 401)
    cookies.delete(COOKIE, { path: cookieOptions.path });
  if (path === "session" && request.method === "DELETE" && result.ok)
    cookies.delete(COOKIE, { path: cookieOptions.path });
  if (path === "email/verify" && result.ok) {
    const data = await result.json().catch(() => null);
    if (
      !data ||
      typeof data.sessionToken !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(data.sessionToken) ||
      typeof data.email !== "string"
    )
      return error(
        502,
        "Verification could not be completed. Please request a new code.",
      );
    cookies.set(COOKIE, data.sessionToken, cookieOptions);
    return Response.json({ email: data.email }, { headers: privateHeaders });
  }
  return new Response(result.body, {
    status: result.status,
    headers: {
      ...privateHeaders,
      "Content-Type": result.headers.get("Content-Type") || "application/json",
    },
  });
}
