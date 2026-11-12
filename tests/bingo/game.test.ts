import assert from "node:assert/strict";
import { test } from "node:test";
import {
  completedLines,
  FREE,
  LINES,
  MAX_PHOTO_BYTES,
  nearestLine,
  newGame,
  normalizeEmail,
  validateGame,
  withPhoto,
} from "../../src/lib/bingo/game";
import { TELLS } from "../../src/lib/bingo/patterns";
import { LEGACY_TELLS } from "../../src/lib/bingo/legacy-patterns";
import { MAX_INPUT_BYTES, validateImage } from "../../src/lib/bingo/images";

const photo = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], {
  type: "image/jpeg",
});

test("24 unique tells, one fixed free center, randomized order and unguessable session IDs", () => {
  assert.equal(TELLS.length, 24);
  assert.equal(new Set(TELLS.map((tell) => tell.id)).size, 24);
  const one = newGame(" player@example.com ", () => 0.25);
  const two = newGame("player@example.com", () => 0.75);
  assert.equal(one.email, "player@example.com");
  assert.equal(one.order.length, 25);
  assert.equal(one.order[12], FREE);
  assert.equal(new Set(one.order).size, 25);
  assert.notDeepEqual(one.order, two.order);
  assert.notEqual(one.token, two.token);
  assert.match(
    one.token,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.equal(nearestLine(one), 4);
  assert.deepEqual(completedLines(one), []);
});

test("all five rows, five columns and both diagonals count; removing breaks a line", () => {
  for (const line of LINES) {
    let game = newGame("player@example.com");
    for (const index of line)
      if (game.order[index] !== FREE)
        game = withPhoto(game, game.order[index], photo);
    assert.ok(
      completedLines(game).some(
        (found) => JSON.stringify(found) === JSON.stringify(line),
      ),
    );
    assert.equal(nearestLine(game), 0);
    game = withPhoto(
      game,
      game.order[line.find((index) => game.order[index] !== FREE)!],
      null,
    );
    assert.deepEqual(completedLines(game), []);
  }
});

test("earlier boards retain their order and evidence when the editorial set changes", () => {
  const order = LEGACY_TELLS.map((tell) => tell.id);
  order.splice(12, 0, FREE);
  const original = withPhoto(
    { ...newGame("player@example.com"), order },
    order[0],
    photo,
  );
  assert.equal(validateGame(original), original);
  assert.equal(original.photos[order[0]].blob, photo);
  assert.deepEqual(original.order, order);
  // An accidental mix must not silently attach old evidence to new tells.
  const mixed = [...order];
  mixed[0] = TELLS[0].id;
  assert.throws(() => validateGame({ ...original, order: mixed }));
});

test("full board has 12 lines and replacement does not duplicate progress", () => {
  let game = newGame("player@example.com");
  for (const id of game.order.filter((id) => id !== FREE))
    game = withPhoto(game, id, photo);
  assert.equal(completedLines(game).length, 12);
  const id = game.order[0];
  const replacement = new Blob(["replacement"], { type: "image/jpeg" });
  game = withPhoto(game, id, replacement);
  assert.equal(Object.keys(game.photos).length, 24);
  assert.equal(game.photos[id].blob, replacement);
  assert.equal(validateGame(game), game);
});

test("invalid email, board, square and oversized saved photos are rejected", () => {
  assert.throws(() => normalizeEmail("x@y"));
  assert.throws(() => normalizeEmail("name @example.com"));
  const game = newGame("player@example.com");
  assert.throws(() => withPhoto(game, FREE, photo));
  assert.throws(() => withPhoto(game, "unknown", photo));
  assert.throws(() =>
    withPhoto(
      game,
      game.order[0],
      new Blob(["<svg />"], { type: "image/svg+xml" }),
    ),
  );
  assert.throws(() =>
    withPhoto(
      game,
      game.order[0],
      new Blob([new Uint8Array(MAX_PHOTO_BYTES + 1)], { type: "image/jpeg" }),
    ),
  );
  assert.throws(() => validateGame({ ...game, order: Array(25).fill(FREE) }));
});

test("image validation checks MIME, signature, nonempty data and byte limit", async () => {
  await validateImage(photo);
  await validateImage(
    new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
      type: "image/png",
    }),
  );
  await assert.rejects(
    validateImage(new Blob(["not an image"], { type: "image/jpeg" })),
  );
  await assert.rejects(
    validateImage(new Blob(["<svg/>"], { type: "image/svg+xml" })),
  );
  await assert.rejects(
    validateImage(new Blob(["heic"], { type: "image/heic" })),
  );
  await assert.rejects(validateImage(new Blob([], { type: "image/png" })));
  await assert.rejects(
    validateImage(
      new Blob([new Uint8Array(MAX_INPUT_BYTES + 1)], { type: "image/jpeg" }),
    ),
  );
});
