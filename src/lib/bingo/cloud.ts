import { validateGame, type Game } from "./game";
import { LocalBingoStorage, type CloudCheckpoint } from "./storage";

export interface RemoteBoard {
  id: string;
  revision: number;
  order: string[];
  createdAt: string;
  photos: Record<string, { digest: string; savedAt: string }>;
}
export interface SaveState {
  phase: "local" | "saving" | "saved" | "error" | "conflict";
  email: string;
  message: string;
}
export class CloudError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function cloudRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/bingo-api/${path}`, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(path === "email/code" ? 45_000 : 25_000),
    });
  } catch {
    throw new CloudError(
      0,
      "Couldn’t connect. Your progress is saved on this device; retry when you’re online.",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new CloudError(
      response.status,
      typeof data?.detail === "string"
        ? data.detail
        : "Couldn’t save online. Your local board is safe.",
    );
  }
  return response.json();
}
const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
export const requestCode = (email: string) =>
  cloudRequest<{ challenge: string; resendAfter: number }>(
    "email/code",
    json({ email }),
  );
export const verifyCode = (challenge: string, code: string) =>
  cloudRequest<{ email: string }>("email/verify", json({ challenge, code }));

function checkpoint(board: RemoteBoard, email: string): CloudCheckpoint {
  return {
    email,
    boardId: board.id,
    revision: board.revision,
    photos: Object.fromEntries(
      Object.entries(board.photos).map(([id, photo]) => [id, photo.digest]),
    ),
  };
}
async function photoDigest(photo: Game["photos"][string]): Promise<string> {
  if (photo.cloudDigest) return photo.cloudDigest;
  const hash = await crypto.subtle.digest(
    "SHA-256",
    await photo.blob.arrayBuffer(),
  );
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export class BingoCloud {
  state: SaveState = {
    phase: "local",
    email: "",
    message: "Saved on this device",
  };
  private again = false;
  private pending: Promise<void> | null = null;
  private paused = 0;
  private listeners = new Set<() => void>();
  constructor(private local: LocalBingoStorage) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private show(state: Partial<SaveState>) {
    this.state = { ...this.state, ...state };
    for (const listener of this.listeners) listener();
  }
  async initialize(): Promise<void> {
    try {
      const { email } = await cloudRequest<{ email: string }>("session");
      this.show({ email });
      await this.sync();
    } catch (error) {
      if (error instanceof CloudError && error.status === 401)
        this.show({ email: "", phase: "local" });
    }
  }
  async connect(game: Game, email: string): Promise<RemoteBoard | null> {
    await this.pending;
    this.show({ email });
    const remote = await cloudRequest<RemoteBoard | null>("board");
    const saved = await this.local.loadCheckpoint();
    if (remote) {
      if (
        remote.id === game.token &&
        saved?.email === email &&
        saved.revision === remote.revision
      ) {
        await this.sync();
        return null;
      }
      return remote;
    }
    const created = await cloudRequest<RemoteBoard>(
      "board",
      json({ id: game.token, order: game.order }),
    );
    await this.local.saveCheckpoint(game.token, checkpoint(created, email));
    await this.sync();
    return null;
  }
  async restore(game: Game, remote: RemoteBoard): Promise<Game> {
    this.paused++;
    try {
      await this.pending;
      const photos: Game["photos"] = {};
      // Bound concurrent requests and memory on mobile. A partial restore is never committed.
      const entries = Object.entries(remote.photos);
      for (let index = 0; index < entries.length; index += 3) {
        await Promise.all(
          entries.slice(index, index + 3).map(async ([id, info]) => {
            const response = await fetch(`/bingo-api/board/photos/${id}`, {
              credentials: "same-origin",
              cache: "no-store",
              signal: AbortSignal.timeout(25_000),
            });
            if (!response.ok)
              throw new CloudError(
                response.status,
                "Couldn’t restore every photo. Your local board is unchanged.",
              );
            photos[id] = {
              blob: await response.blob(),
              savedAt: info.savedAt,
              cloudDigest: info.digest,
            };
          }),
        );
      }
      const latest = await cloudRequest<RemoteBoard>("board");
      if (
        !latest ||
        latest.id !== remote.id ||
        latest.revision !== remote.revision
      )
        throw new CloudError(
          409,
          "The saved board changed while restoring. Try again.",
        );
      const next = validateGame({
        version: 1,
        token: remote.id,
        revision: 0,
        email: this.state.email,
        order: remote.order,
        photos,
        createdAt: remote.createdAt,
      });
      const restored = await this.local.restore(
        game,
        next,
        checkpoint(remote, this.state.email),
      );
      this.show({ phase: "saved", message: "Saved across devices" });
      return restored;
    } finally {
      this.paused--;
    }
  }
  async signOut(): Promise<void> {
    this.paused++;
    try {
      await this.pending;
      await cloudRequest("session", { method: "DELETE" });
      this.show({
        phase: "local",
        email: "",
        message: "Signed out. This browser still has your local board.",
      });
    } finally {
      this.paused--;
    }
  }
  sync(): Promise<void> {
    if (this.paused) return Promise.resolve();
    if (this.pending) {
      this.again = true;
      return this.pending;
    }
    this.pending = this.runSync().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }
  private async runSync(): Promise<void> {
    try {
      do {
        this.again = false;
        const game = await this.local.load();
        let saved = await this.local.loadCheckpoint();
        if (
          !game ||
          !saved ||
          !this.state.email ||
          saved.email !== this.state.email ||
          saved.boardId !== game.token
        ) {
          this.show({ phase: "local", message: "Saved on this device" });
          return;
        }
        this.show({
          phase: "saving",
          message: "Saved on this device · saving online…",
        });
        const latest = await cloudRequest<RemoteBoard | null>("board");
        if (
          !latest ||
          latest.id !== saved.boardId ||
          latest.revision !== saved.revision
        ) {
          throw new CloudError(
            409,
            "Your saved board changed or expired. Your local photos are safe.",
          );
        }
        // The stored revision prevents another device's newer work being overwritten.
        for (const id of new Set([
          ...Object.keys(game.photos),
          ...Object.keys(saved.photos),
        ])) {
          const photo = game.photos[id];
          const wanted = photo ? await photoDigest(photo) : undefined;
          if (wanted === saved.photos[id]) continue;
          const remote = await cloudRequest<RemoteBoard>(`board/photos/${id}`, {
            method: photo ? "PUT" : "DELETE",
            headers: {
              "X-Bingo-Board": saved.boardId,
              "If-Match": String(saved.revision),
              ...(photo ? { "Content-Type": "image/jpeg" } : {}),
            },
            body: photo?.blob,
          });
          saved = checkpoint(remote, this.state.email);
          await this.local.saveCheckpoint(game.token, saved);
        }
        const current = await this.local.load();
        if (current?.token === game.token && current.revision !== game.revision)
          this.again = true;
        this.show({ phase: "saved", message: "Saved across devices" });
      } while (this.again && !this.paused);
    } catch (error) {
      const status = error instanceof CloudError ? error.status : 0;
      this.show({
        phase: status === 409 ? "conflict" : "error",
        ...(status === 401 ? { email: "" } : {}),
        message:
          error instanceof Error
            ? error.message
            : "Couldn’t save online. Your local board is safe.",
      });
    }
  }
}
