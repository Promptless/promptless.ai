import { TELLS, TELL_SETS } from "./patterns";

export const FREE = "free";
export const MAX_PHOTO_BYTES = 1024 * 1024;
export const MAX_TOTAL_BYTES = 24 * MAX_PHOTO_BYTES;
export interface Photo {
  blob: Blob;
  savedAt: string;
  // Present only on photos restored from the authenticated server.
  cloudDigest?: string;
}
export interface Game {
  version: 1;
  token: string;
  revision: number;
  email: string;
  order: string[];
  photos: Record<string, Photo>;
  createdAt: string;
}

export function normalizeEmail(value: string): string {
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter an email address such as you@example.com.");
  }
  return email;
}

export function newGame(email = "", random = Math.random): Game {
  const order = TELLS.map((tell) => tell.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.splice(12, 0, FREE);
  return {
    version: 1,
    token: crypto.randomUUID(),
    revision: 0,
    email: email ? normalizeEmail(email) : "",
    order,
    photos: {},
    createdAt: new Date().toISOString(),
  };
}

export const LINES = [
  ...Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => row * 5 + col),
  ),
  ...Array.from({ length: 5 }, (_, col) =>
    Array.from({ length: 5 }, (_, row) => row * 5 + col),
  ),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function completedLines(
  game: Pick<Game, "order" | "photos">,
): number[][] {
  return LINES.filter((line) =>
    line.every(
      (index) =>
        game.order[index] === FREE || Boolean(game.photos[game.order[index]]),
    ),
  );
}

export function nearestLine(game: Pick<Game, "order" | "photos">): number {
  return Math.min(
    ...LINES.map(
      (line) =>
        line.filter(
          (index) =>
            game.order[index] !== FREE && !game.photos[game.order[index]],
        ).length,
    ),
  );
}

export function withPhoto(game: Game, id: string, blob: Blob | null): Game {
  if (id === FREE || !game.order.includes(id))
    throw new Error("Choose a square on this board.");
  const photos = { ...game.photos };
  if (blob) {
    if (
      blob.type !== "image/jpeg" ||
      blob.size === 0 ||
      blob.size > MAX_PHOTO_BYTES
    )
      throw new Error("That photo could not be saved. Try a smaller photo.");
    photos[id] = { blob, savedAt: new Date().toISOString() };
  } else delete photos[id];
  if (
    Object.values(photos).reduce((sum, photo) => sum + photo.blob.size, 0) >
    MAX_TOTAL_BYTES
  )
    throw new Error("This board is full. Remove a photo and try again.");
  return { ...game, photos };
}

export function validateGame(value: unknown): Game {
  const game = value as Game;
  if (
    !game ||
    game.version !== 1 ||
    typeof game.token !== "string" ||
    !Number.isInteger(game.revision) ||
    game.revision < 0 ||
    !Array.isArray(game.order) ||
    game.order.length !== 25 ||
    game.order[12] !== FREE ||
    new Set(game.order).size !== 25 ||
    !TELL_SETS.some((tells) =>
      tells.every((tell) => game.order.includes(tell.id)),
    ) ||
    !game.photos ||
    typeof game.photos !== "object"
  ) {
    throw new Error(
      "This browser’s saved board could not be read. Your data has not been replaced.",
    );
  }
  if (game.email !== "") normalizeEmail(game.email);
  for (const [id, photo] of Object.entries(game.photos)) {
    if (
      id === FREE ||
      !game.order.includes(id) ||
      !(photo.blob instanceof Blob) ||
      photo.blob.type !== "image/jpeg" ||
      photo.blob.size > MAX_PHOTO_BYTES
    ) {
      throw new Error(
        "A saved photo could not be read. Your data has not been replaced.",
      );
    }
  }
  return game;
}
