import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { proxyBingo, type ProxyContext } from "../../src/lib/bingo/proxy";

const config = {
  base: "https://backend.example/bingo",
  secret: "test-proxy-secret-for-unit-tests-only",
  production: true,
};
function context(
  path: string,
  method = "GET",
  origin = "https://promptless.ai",
  body?: string,
) {
  const saved: { name: string; value: string; options: object }[] = [];
  const deleted: string[] = [];
  const url = new URL(`https://promptless.ai/bingo-api/${path}`);
  const ctx: ProxyContext = {
    url,
    params: { path },
    clientAddress: "127.0.0.1",
    request: new Request(url, {
      method,
      headers: { Origin: origin, "Content-Type": "application/json" },
      body,
    }),
    cookies: {
      get: () => ({ value: "stored-cookie-token" }),
      set: (name, value, options) => {
        saved.push({ name, value, options });
      },
      delete: (name) => {
        deleted.push(name);
      },
    },
  };
  return { ctx, saved, deleted };
}

test("verification strips the server token and sets a private secure cookie", async () => {
  const item = context(
    "email/verify",
    "POST",
    undefined,
    JSON.stringify({ challenge: "x", code: "123456" }),
  );
  const token = "x".repeat(43);
  const fetch = mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init: RequestInit) => {
      const headers = new Headers(init.headers);
      assert.equal(headers.get("X-Bingo-Proxy-Key"), config.secret);
      assert.equal(headers.get("Authorization"), "Bearer stored-cookie-token");
      assert.equal(init.redirect, "error");
      return Response.json({ sessionToken: token, email: "a@example.com" });
    },
  );
  try {
    const response = await proxyBingo(item.ctx, config);
    assert.deepEqual(await response.json(), { email: "a@example.com" });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(item.saved[0], {
      name: "bingo_session",
      value: token,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/bingo-api",
        maxAge: 2592000,
      },
    });
  } finally {
    fetch.mock.restore();
  }
});

test("cross-origin writes, unknown paths, and oversized bodies never reach the backend", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => {
    throw new Error("Must not forward");
  });
  try {
    assert.equal(
      (
        await proxyBingo(
          context("email/code", "POST", "https://evil.example", "{}").ctx,
          config,
        )
      ).status,
      403,
    );
    assert.equal(
      (await proxyBingo(context("../admin").ctx, config)).status,
      404,
    );
    assert.equal(
      (
        await proxyBingo(
          context("email/code", "POST", undefined, "x".repeat(4097)).ctx,
          config,
        )
      ).status,
      413,
    );
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    fetch.mock.restore();
  }
});

test("disabled saving fails closed and a malformed verification never sets a cookie", async () => {
  const item = context("email/verify", "POST", undefined, "{}");
  assert.equal((await proxyBingo(item.ctx, { production: true })).status, 503);
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json({ email: "a@example.com" }),
  );
  try {
    assert.equal((await proxyBingo(item.ctx, config)).status, 502);
    assert.equal(item.saved.length, 0);
  } finally {
    fetch.mock.restore();
  }
});

test("expiry clears the cookie and does not forward client-supplied authentication", async () => {
  const item = context("board");
  item.ctx.request.headers.set("Authorization", "Bearer forged");
  item.ctx.request.headers.set("X-Bingo-Proxy-Key", "forged");
  const fetch = mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init: RequestInit) => {
      assert.equal(
        new Headers(init.headers).get("Authorization"),
        "Bearer stored-cookie-token",
      );
      return Response.json({ detail: "Expired" }, { status: 401 });
    },
  );
  try {
    assert.equal((await proxyBingo(item.ctx, config)).status, 401);
    assert.deepEqual(item.deleted, ["bingo_session"]);
  } finally {
    fetch.mock.restore();
  }
});
