import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { proxyLeaderboard } from "../../src/lib/bingo/leaderboard-proxy";
import { leaderboardSchema } from "../../src/lib/bingo/leaderboard";

const config = {
  base: "https://backend.example/bingo",
  secret: "test-proxy-secret-for-unit-tests-only",
  production: true,
};
const snapshot = {
  status: "provisional",
  updatedAt: "2026-10-26T18:00:00Z",
  entries: [
    { rank: 1, alias: "Player ABCDEF1234", bingoLines: 1, tellsFound: 4 },
  ],
};

test("public projection uses a fixed upstream with no player cookies or authorization", async () => {
  const fetch = mock.method(
    globalThis,
    "fetch",
    async (url: string, init: RequestInit) => {
      assert.equal(url, `${config.base}/leaderboard`);
      assert.deepEqual(
        [...new Headers(init.headers)],
        [["x-bingo-proxy-key", config.secret]],
      );
      assert.equal(init.redirect, "error");
      assert.equal(init.cache, "no-store");
      return Response.json(snapshot, {
        headers: { "Set-Cookie": "private=value", "X-Private": "hidden" },
      });
    },
  );
  try {
    const response = await proxyLeaderboard(config);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), snapshot);
    assert.match(response.headers.get("Cache-Control")!, /s-maxage=30/);
    assert.equal(response.headers.get("Set-Cookie"), null);
    assert.equal(response.headers.get("X-Private"), null);
  } finally {
    fetch.mock.restore();
  }
});

test("private fields, malformed metrics, and oversized payloads cannot reach the public response", async () => {
  const invalid = [
    { ...snapshot, email: "private@example.test" },
    { ...snapshot, entries: [{ ...snapshot.entries[0], photos: ["private"] }] },
    {
      ...snapshot,
      entries: [{ ...snapshot.entries[0], alias: "private@example.test" }],
    },
    { ...snapshot, entries: [{ ...snapshot.entries[0], bingoLines: 13 }] },
    { ...snapshot, entries: [{ ...snapshot.entries[0], tellsFound: 25 }] },
    { ...snapshot, entries: [{ ...snapshot.entries[0], rank: 0 }] },
    { ...snapshot, updatedAt: "invalid" },
    { ...snapshot, entries: Array(1001).fill(snapshot.entries[0]) },
  ];
  for (const body of invalid) {
    assert.equal(leaderboardSchema.safeParse(body).success, false);
    const fetch = mock.method(globalThis, "fetch", async () =>
      Response.json(body),
    );
    try {
      const response = await proxyLeaderboard(config);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.doesNotMatch(await response.text(), /private|photos|example/);
    } finally {
      fetch.mock.restore();
    }
  }
  const fetch = mock.method(
    globalThis,
    "fetch",
    async () => new Response("x".repeat(256 * 1024 + 1)),
  );
  try {
    assert.equal((await proxyLeaderboard(config)).status, 503);
  } finally {
    fetch.mock.restore();
  }
});

test("an empty snapshot is successful but dependency failures are never empty standings", async () => {
  let response = Response.json({ ...snapshot, entries: [] });
  const fetch = mock.method(globalThis, "fetch", async () => response);
  try {
    assert.deepEqual(
      (await (await proxyLeaderboard(config)).json()).entries,
      [],
    );
    for (const status of [403, 404, 500, 503]) {
      response = new Response("private upstream details", { status });
      const result = await proxyLeaderboard(config);
      assert.equal(result.status, 503);
      assert.doesNotMatch(await result.text(), /private|entries/);
    }
    response = new Response("not JSON");
    assert.equal((await proxyLeaderboard(config)).status, 503);
  } finally {
    fetch.mock.restore();
  }
  const outage = mock.method(globalThis, "fetch", async () => {
    throw new TypeError("private connection details");
  });
  try {
    assert.equal((await proxyLeaderboard(config)).status, 503);
  } finally {
    outage.mock.restore();
  }
});

test("invalid configuration does not make an upstream request", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => {
    throw new Error("Must not call");
  });
  try {
    for (const override of [
      { base: undefined },
      { secret: "short" },
      { base: "not a URL" },
      { base: "http://backend.example/bingo" },
      { base: "https://user:password@backend.example/bingo" },
      { base: "https://backend.example/bingo?email=private" },
      { base: "https://backend.example/bingo#private" },
    ])
      assert.equal(
        (await proxyLeaderboard({ ...config, ...override })).status,
        503,
      );
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    fetch.mock.restore();
  }
});
