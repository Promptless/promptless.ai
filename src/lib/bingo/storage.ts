import {
  newGame,
  normalizeEmail,
  validateGame,
  withPhoto,
  type Game,
} from "./game";

// Device storage owns the immediate save. Verified server sync is a separate adapter.
export interface BingoStorage {
  load(): Promise<Game | null>;
  create(email?: string): Promise<Game>;
  savePhoto(game: Game, id: string, photo: Blob | null): Promise<Game>;
  saveEmail(game: Game, email: string): Promise<Game>;
  clear(game: Game): Promise<void>;
}

export interface CloudCheckpoint {
  email: string;
  boardId: string;
  revision: number;
  photos: Record<string, string>;
}

export class LocalBingoStorage implements BingoStorage {
  private async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("promptless-ai-tells-bingo", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("boards");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Close other Bingo tabs, then try again."));
    });
  }

  private async transaction<T>(
    mode: IDBTransactionMode,
    run: (
      store: IDBObjectStore,
      result: (value: T) => void,
      fail: (error: unknown) => void,
    ) => void,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction("boards", mode);
      let value: T;
      let failure: unknown;
      tx.oncomplete = () => {
        db.close();
        resolve(value);
      };
      tx.onabort = tx.onerror = () => {
        db.close();
        reject(
          failure || tx.error || new Error("Could not save in this browser."),
        );
      };
      const fail = (error: unknown) => {
        failure = error;
        tx.abort();
      };
      try {
        run(
          tx.objectStore("boards"),
          (next) => {
            value = next;
          },
          fail,
        );
      } catch (error) {
        fail(error);
      }
    });
  }

  load(): Promise<Game | null> {
    return this.transaction<Game | null>("readonly", (store, done) => {
      const request = store.get("active");
      request.onsuccess = () => done(request.result ?? null);
    }).then((game) => (game ? validateGame(game) : null));
  }

  create(email = ""): Promise<Game> {
    const game = newGame(email);
    return this.transaction<Game>("readwrite", (store, done, fail) => {
      const request = store.get("active");
      request.onsuccess = () => {
        // Two tabs starting simultaneously converge on the first saved board.
        try {
          if (request.result) done(request.result);
          else {
            store.put(game, "active");
            done(game);
          }
        } catch (error) {
          fail(error);
        }
      };
    }).then(validateGame);
  }

  private async update(
    game: Game,
    transform: (current: Game) => Game | null,
  ): Promise<Game | null> {
    let conflict = false;
    const result = await this.transaction<Game | null>(
      "readwrite",
      (store, done, fail) => {
        const request = store.get("active");
        request.onsuccess = () => {
          const current = request.result as Game | undefined;
          if (
            !current ||
            current.token !== game.token ||
            current.revision !== game.revision
          ) {
            conflict = true;
            done(null);
            return;
          }
          try {
            const next = transform(current);
            if (next) {
              next.revision = current.revision + 1;
              store.put(next, "active");
            } else {
              store.delete("active");
              store.delete("cloud");
              store.delete("previous");
              store.delete("backups");
            }
            done(next);
          } catch (error) {
            fail(error);
          }
        };
      },
    );
    if (conflict)
      throw new Error(
        "This board changed in another tab. Close this panel and refresh before trying again.",
      );
    return result;
  }

  async savePhoto(game: Game, id: string, blob: Blob | null): Promise<Game> {
    // Validate before entering the transaction; no throwing callbacks in IDB events.
    const next = withPhoto(game, id, blob);
    return (await this.update(game, () => next))!;
  }
  async saveEmail(game: Game, email: string): Promise<Game> {
    const normalized = normalizeEmail(email);
    return (await this.update(game, (current) => ({
      ...current,
      email: normalized,
    })))!;
  }
  async clear(game: Game): Promise<void> {
    await this.update(game, () => null);
  }

  loadCheckpoint(): Promise<CloudCheckpoint | null> {
    return this.transaction("readonly", (store, done) => {
      const request = store.get("cloud");
      request.onsuccess = () => done(request.result ?? null);
    });
  }

  saveCheckpoint(
    token: string,
    checkpoint: CloudCheckpoint | null,
  ): Promise<void> {
    return this.transaction("readwrite", (store, done, fail) => {
      const request = store.get("active");
      request.onsuccess = () => {
        if (request.result?.token !== token) {
          fail(new Error("Your local board changed. Refresh before saving."));
          return;
        }
        const saved = store.get("cloud");
        saved.onsuccess = () => {
          const old = saved.result as CloudCheckpoint | undefined;
          if (
            checkpoint &&
            old?.email === checkpoint.email &&
            old.boardId === checkpoint.boardId &&
            old.revision > checkpoint.revision
          ) {
            fail(
              new Error(
                "Another tab finished saving first. Refresh before retrying.",
              ),
            );
            return;
          }
          if (checkpoint) store.put(checkpoint, "cloud");
          else store.delete("cloud");
          done(undefined);
        };
      };
    });
  }

  async restore(
    current: Game,
    incoming: Game,
    checkpoint: CloudCheckpoint | null,
  ): Promise<Game> {
    validateGame(incoming);
    return this.transaction("readwrite", (store, done, fail) => {
      const request = store.get("active");
      request.onsuccess = () => {
        const active = request.result as Game;
        if (
          !active ||
          active.token !== current.token ||
          active.revision !== current.revision
        ) {
          fail(
            new Error(
              "Your local board changed. Close this panel and try again.",
            ),
          );
          return;
        }
        const saved = store.get("backups");
        saved.onsuccess = () => {
          // Backups accumulate until the player explicitly deletes device data.
          // If storage is full, this entire transaction rolls back, keeping the active board.
          const backups = (saved.result ?? []) as Game[];
          if (
            Object.keys(active.photos).length &&
            !backups.some(
              (b) => b.token === active.token && b.revision === active.revision,
            )
          )
            backups.push(active);
          store.put(backups, "backups");
          const next = { ...incoming, revision: active.revision + 1 };
          store.put(next, "active");
          if (checkpoint) store.put(checkpoint, "cloud");
          else store.delete("cloud");
          done(next);
        };
      };
    });
  }

  loadBackups(): Promise<Game[]> {
    return this.transaction<Game[]>("readonly", (store, done) => {
      const request = store.get("backups");
      request.onsuccess = () => done(request.result ?? []);
    }).then((games) => games.map(validateGame).reverse());
  }
}

export function storageError(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return "Your browser is out of storage. The previous photo is safe. Free some space or remove a saved photo, then try again.";
  if (error instanceof DOMException)
    return "Your browser could not save this change. Allow site storage or try a regular browser window. Your last saved board is unchanged.";
  return error instanceof Error
    ? error.message
    : "Something went wrong. Your last saved board is unchanged. Please try again.";
}
