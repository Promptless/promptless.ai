import assert from "node:assert/strict";
import { test, mock } from "node:test";
import {
  BingoCloud,
  CloudError,
  type RemoteBoard,
} from "../../src/lib/bingo/cloud";
import { newGame, withPhoto } from "../../src/lib/bingo/game";
import {
  LocalBingoStorage,
  type CloudCheckpoint,
} from "../../src/lib/bingo/storage";

class MemoryStorage extends LocalBingoStorage {
  game = newGame();
  checkpoint: CloudCheckpoint | null = null;
  writes = 0;
  async load() {
    return this.game;
  }
  async loadCheckpoint() {
    return this.checkpoint;
  }
  async saveCheckpoint(_token: string, checkpoint: CloudCheckpoint | null) {
    this.writes++;
    this.checkpoint = checkpoint;
  }
}

test("missing configuration and connection failure preserve local data; 401 makes email sign-in available", async () => {
  const local = new MemoryStorage();
  const original = local.game;
  const cloud = new BingoCloud(local);
  let mode = 503;
  const fetch = mock.method(globalThis, "fetch", async () => {
    if (mode === 0) throw new TypeError("offline");
    return Response.json({ detail: "Saving is unavailable" }, { status: mode });
  });
  try {
    await cloud.initialize();
    assert.equal(cloud.state.availability, "unavailable");
    assert.equal(cloud.state.phase, "error");
    assert.equal(cloud.state.message, "Saving is unavailable");
    await cloud.sync();
    assert.equal(
      fetch.mock.callCount(),
      1,
      "sync must not erase the unavailable state",
    );
    mode = 0;
    await cloud.initialize();
    assert.equal(cloud.state.availability, "unavailable");
    mode = 401;
    await cloud.initialize();
    assert.equal(cloud.state.availability, "available");
    assert.equal(cloud.state.phase, "local");
    assert.equal(cloud.state.email, "");
    assert.equal(local.game, original);
    assert.equal(local.writes, 0);
  } finally {
    fetch.mock.restore();
  }
});

test("verification followed by a failed upload rejects; retry saves the original photo", async () => {
  const local = new MemoryStorage();
  const photoId = local.game.order[0];
  local.game = withPhoto(
    local.game,
    photoId,
    new Blob(["synthetic photo"], { type: "image/jpeg" }),
  );
  const original = local.game;
  const cloud = new BingoCloud(local);
  let remote: RemoteBoard | null = null;
  let failUpload = true;
  const fetch = mock.method(
    globalThis,
    "fetch",
    async (url: string, init: RequestInit = {}) => {
      if (url.endsWith("/board") && init.method === "POST") {
        remote = {
          ...JSON.parse(init.body as string),
          revision: 0,
          publicAlias: "Player ABCDEF1234",
          photos: {},
          createdAt: local.game.createdAt,
        };
      } else if (url.includes("/photos/")) {
        assert.equal(await (init.body as Blob).text(), "synthetic photo");
        if (failUpload)
          return Response.json(
            { detail: "Upload failed. Your local board is safe." },
            { status: 503 },
          );
        remote = {
          ...remote!,
          revision: 1,
          photos: {
            [photoId]: {
              digest: "saved-digest",
              savedAt: local.game.createdAt,
            },
          },
        };
      }
      return Response.json(remote);
    },
  );
  try {
    await assert.rejects(
      cloud.connect(local.game, "player@example.test"),
      /Upload failed/,
    );
    assert.equal(cloud.state.phase, "error");
    assert.equal(local.game, original);
    assert.deepEqual(local.checkpoint?.photos, {});
    failUpload = false;
    assert.equal(await cloud.connect(local.game, "player@example.test"), null);
    assert.equal(cloud.state.phase, "saved");
    assert.equal(local.checkpoint?.revision, 1);
    assert.equal(local.game, original);
  } finally {
    fetch.mock.restore();
  }
});

test("expired verification session clears the account and retains the local board", async () => {
  const local = new MemoryStorage();
  const original = local.game;
  const cloud = new BingoCloud(local);
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json(
      { detail: "Session expired. Verify again." },
      { status: 401 },
    ),
  );
  try {
    await assert.rejects(
      cloud.connect(local.game, "player@example.test"),
      (error: unknown) => error instanceof CloudError && error.status === 401,
    );
    assert.equal(cloud.state.email, "");
    assert.equal(cloud.state.phase, "error");
    assert.equal(local.game, original);
    assert.equal(local.writes, 0);
  } finally {
    fetch.mock.restore();
  }
});
