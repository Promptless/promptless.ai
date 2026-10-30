import Modal from "./BingoModal";
import SavePanel, { type EmailCodeRequest } from "./SavePanel";
import { BingoCloud, requestCode } from "../../lib/bingo/cloud";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactEventHandler,
} from "react";
import {
  completedLines,
  FREE,
  nearestLine,
  type Game,
} from "../../lib/bingo/game";
import { TELLS, TELL_BY_ID, type Tell } from "../../lib/bingo/patterns";
import { preparePhoto } from "../../lib/bingo/images";
import {
  LocalBingoStorage,
  storageError,
  type BingoStorage,
} from "../../lib/bingo/storage";

const localStorageAdapter = new LocalBingoStorage();
const cloud = new BingoCloud(localStorageAdapter);
const track = (action: string) => ({
  "data-track-action": action,
  "data-track-funnel": "bingo",
  "data-track-location": "bingo",
  "data-track-campaign": "lavacon",
});

function Photo({
  blob,
  className = "",
  onLoad,
}: {
  blob: Blob;
  className?: string;
  onLoad?: ReactEventHandler<HTMLImageElement>;
}) {
  const [source, setSource] = useState<{ blob: Blob; url: string } | null>(
    null,
  );
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setSource({ blob, url: next });
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  // A replacement must load its own preview before invoking the new handler.
  return source?.blob === blob ? (
    <img
      src={source.url}
      className={className}
      alt="Your saved writing example"
      onLoad={onLoad}
    />
  ) : null;
}

function Evidence({
  tell,
  game,
  storage,
  onSaved,
  onClose,
}: {
  tell: Tell;
  game: Game;
  storage: BingoStorage;
  onSaved: (game: Game, message: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Blob | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);
  const operation = useRef(0);
  const saveLock = useRef(false);
  const upload = useRef<HTMLInputElement>(null);
  const existing = game.photos[tell.id]?.blob;
  useEffect(
    () => () => {
      operation.current++;
    },
    [],
  );

  async function choose(file?: File) {
    if (!file) return; // Native picker cancellation leaves the previous photo intact.
    const current = ++operation.current;
    setPreparing(true);
    setError("");
    setRemoving(false);
    try {
      const next = await preparePhoto(file);
      if (current === operation.current) setDraft(next);
    } catch (failure) {
      if (current === operation.current) setError(storageError(failure));
    } finally {
      if (current === operation.current) setPreparing(false);
    }
  }

  async function save(blob: Blob | null) {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError("");
    try {
      const next = await storage.savePhoto(game, tell.id, blob);
      onSaved(
        next,
        blob
          ? "Photo saved on this device. Nice find!"
          : "Photo removed. This square is open again.",
      );
    } catch (failure) {
      setError(storageError(failure));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal title={tell.label} onClose={onClose} locked={saving}>
      <p className="hint">{tell.hint}</p>
      <blockquote>
        <span className="eyebrow">WHAT TO LOOK FOR</span>
        <p>{tell.example}</p>
      </blockquote>
      {(draft || existing) && (
        <div className="photo-preview">
          <Photo
            blob={(draft || existing)!}
            onLoad={(event) => {
              if (!draft || preparing || error) return;
              const dialog = event.currentTarget.closest("dialog");
              // The image now has dimensions. Move only the modal, without animation or a focus change.
              dialog?.scrollTo({
                top: dialog.scrollHeight,
                behavior: "instant",
              });
            }}
          />
          <span>
            {draft ? "Preview · not saved yet" : "Saved on this device"}
          </span>
        </div>
      )}
      <p className="photo-guidance">
        Photograph the writing, not someone’s personal details. Only add images
        you have permission to use.
      </p>
      <input
        ref={upload}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        aria-label="Upload photo"
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="button-row">
        <button
          type="button"
          className="button secondary"
          disabled={preparing || saving}
          onClick={() => upload.current?.click()}
          {...track("bingo_upload")}
        >
          Take or Upload Photo
        </button>
      </div>
      <p className="fine">
        JPEG, PNG or WebP · up to 12 MB. Camera availability depends on your
        phone and browser.
      </p>
      {preparing && (
        <p role="status">Preparing a private copy… You can cancel below.</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {draft && (
        <button
          type="button"
          className="button primary full"
          disabled={preparing || saving}
          onClick={() => void save(draft)}
          {...track("bingo_save")}
        >
          {saving ? "Saving…" : "Save photo & mark square"}
        </button>
      )}
      {existing && !draft && !removing && (
        <button
          type="button"
          className="text-button danger"
          disabled={saving || preparing}
          onClick={() => setRemoving(true)}
        >
          Remove saved photo
        </button>
      )}
      {removing && (
        <div className="confirm">
          <p>Remove this photo and unmark the square?</p>
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              disabled={saving}
              onClick={() => setRemoving(false)}
            >
              Keep photo
            </button>
            <button
              type="button"
              className="button danger-button"
              disabled={saving}
              onClick={() => void save(null)}
            >
              Remove photo
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="text-button full"
        disabled={saving}
        onClick={onClose}
      >
        {draft || preparing
          ? "Cancel — keep my last saved board"
          : "Back to board"}
      </button>
    </Modal>
  );
}

export default function BingoApp({
  storage = localStorageAdapter,
}: {
  storage?: BingoStorage;
}) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState(cloud.state);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeRequest, setCodeRequest] = useState<
    EmailCodeRequest | undefined
  >();
  const emailLock = useRef(false);

  async function saveWithEmail(event: FormEvent) {
    event.preventDefault();
    if (emailLock.current) return;
    const address = email.trim();
    if (
      codeRequest?.email === address &&
      Date.now() - codeRequest.requestedAt < 600_000
    ) {
      setPanel("save");
      return;
    }
    emailLock.current = true;
    setSendingCode(true);
    setEmailError("");
    try {
      const sent = await requestCode(address);
      setCodeRequest({ email: address, ...sent, requestedAt: Date.now() });
      setPanel("save");
    } catch (failure) {
      setEmailError(
        failure instanceof Error
          ? failure.message
          : "Couldn’t send a code. Please try again.",
      );
    } finally {
      emailLock.current = false;
      setSendingCode(false);
    }
  }
  useEffect(() => cloud.subscribe(() => setSaveState(cloud.state)), []);
  useEffect(() => {
    void cloud.initialize();
  }, []);
  useEffect(() => {
    if (game) void cloud.sync();
  }, [game?.token, game?.revision, saveState.email]);
  useEffect(() => {
    const retry = () => void cloud.initialize();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  async function load() {
    setError("");
    try {
      setGame((await storage.load()) ?? (await storage.create()));
    } catch (failure) {
      setError(storageError(failure));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [storage]);
  useEffect(() => {
    const refresh = () => {
      if (!panel) void load();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [panel, storage]);

  const close = () => {
    setPanel(null);
    void load();
  };
  const saved = (next: Game, text: string) => {
    setGame(next);
    setPanel(null);
    setMessage(text);
  };
  const lines = game ? completedLines(game) : [];
  const winning = new Set(lines.flat());
  const count = game ? Object.keys(game.photos).length : 0;

  return (
    <div className="bingo-app">
      <header className="bingo-header">
        <a href="/" aria-label="Promptless home">
          <img
            src="/assets/text_logo_white.svg"
            alt="Promptless"
            width="126"
            height="26"
          />
        </a>
        <span className="event-tag">LAVACON FIELD GAME</span>
      </header>
      <main id="main-content">
        <section className="intro">
          <h1>
            AI Tells <span>Bingo</span>
            <span className="title-star" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p className="intro-copy">
            A scavenger hunt for writing with a whiff of slop.
          </p>
          <p className="authorship-note">
            Note: Humans do it too! No shaming lifelong em-dash enjoyers.
          </p>
        </section>
        {loading ? (
          <div className="signup-card" role="status">
            Finding your board…
          </div>
        ) : game ? (
          <section className="play-area" aria-labelledby="board-title">
            {saveState.availability === "unavailable" ? (
              <div className="save-banner saved-summary">
                <div>
                  <strong>Email saving is unavailable</strong>
                  <p role="status">{saveState.message}</p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => void cloud.initialize()}
                >
                  Retry connection
                </button>
              </div>
            ) : saveState.email ? (
              <div className="save-banner saved-summary">
                <div>
                  <strong>
                    {saveState.phase === "saved"
                      ? "Your board is saved"
                      : "Your work is saved on this device"}
                  </strong>
                  <p role="status">{saveState.message}</p>
                  {saveState.phase === "saved" && saveState.publicAlias && (
                    <p>
                      <a href="/bingo-leaderboard">
                        Provisional leaderboard: {saveState.publicAlias}
                      </a>
                    </p>
                  )}
                </div>
                <button
                  className="button secondary"
                  onClick={() => {
                    setCodeRequest(undefined);
                    setPanel("save");
                  }}
                >
                  {saveState.phase === "error"
                    ? "Retry saving"
                    : saveState.phase === "conflict"
                      ? "Review saved board"
                      : "Manage saving"}
                </button>
              </div>
            ) : (
              <form
                className="save-banner"
                onSubmit={saveWithEmail}
                aria-labelledby="save-title"
              >
                <strong id="save-title">
                  Enter your email to save your work
                </strong>
                <div className="email-save-row">
                  <input
                    type="email"
                    aria-label="Your email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    maxLength={254}
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={
                      sendingCode || saveState.availability === "checking"
                    }
                    aria-describedby="save-note"
                  />
                  <button
                    className="button secondary"
                    type="submit"
                    disabled={
                      sendingCode || saveState.availability === "checking"
                    }
                  >
                    {sendingCode
                      ? "Sending…"
                      : saveState.availability === "checking"
                        ? "Checking…"
                        : "Save"}
                  </button>
                </div>
                <p id="save-note">
                  Saved on this device until you verify your email.
                </p>
                {emailError && (
                  <p className="error" role="alert">
                    {emailError}
                  </p>
                )}
              </form>
            )}
            <div className="board-toolbar">
              <h2 id="board-title">Your field notes</h2>
              <p>
                {count} of 24 spotted <span aria-hidden="true">·</span>{" "}
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </p>
            </div>
            {!TELLS.every((tell) => game.order.includes(tell.id)) && (
              <p className="fine">
                This saved board uses the earlier tell list. Its squares, order,
                and photos are preserved.
              </p>
            )}
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Patterns spotted"
              aria-valuemin={0}
              aria-valuemax={24}
              aria-valuenow={count}
            >
              <span style={{ width: `${(count / 24) * 100}%` }} />
            </div>
            <div
              className={`board-message ${lines.length ? "success" : ""}`}
              role="status"
            >
              {lines.length ? (
                <>
                  <strong>✳ BINGO! Nice eye.</strong>
                  <span>
                    {count === 24
                      ? "A full field guide. You found them all!"
                      : "Show your board at the booth, or keep collecting."}
                  </span>
                </>
              ) : (
                <>
                  <strong>
                    {nearestLine(game)} finds from your first bingo.
                  </strong>
                  <span>Tap a square for a hint.</span>
                </>
              )}
            </div>
            <details className="how-to where-to-look">
              <summary>Where should I look for the slop?</summary>
              <p>
                Start a chat with ChatGPT, Claude, or Gemini, or look on
                LinkedIn (you probably won’t have to scroll far). And yes,
                Promptless’s own materials are fair game. Bonus points for
                catching us in the act!
              </p>
            </details>
            <div
              className="board"
              aria-label="Bingo board, five rows and five columns"
            >
              {game.order.map((id, index) =>
                id === FREE ? (
                  <div
                    key={id}
                    className="square free"
                    aria-label="Free square for being human, already marked"
                  >
                    <span aria-hidden="true">✳</span>
                    <strong>Free square</strong>
                    <small>for being human</small>
                  </div>
                ) : (
                  <button
                    key={id}
                    className={`square ${game.photos[id] ? "marked" : ""} ${winning.has(index) ? "winner" : ""}`}
                    onClick={() => setPanel(id)}
                    aria-label={`${TELL_BY_ID.get(id)!.label}, row ${Math.floor(index / 5) + 1}, column ${(index % 5) + 1}, ${game.photos[id] ? "photo saved" : "add a photo"}`}
                    {...track("bingo_square")}
                  >
                    <span className="square-label">
                      {TELL_BY_ID.get(id)!.label}
                    </span>
                    <span className="square-mark" aria-hidden="true">
                      {game.photos[id] ? "✓" : "+"}
                    </span>
                  </button>
                ),
              )}
            </div>
            <p className="local-status">
              ● Saved on this browser · Your photos are private
            </p>
            <p className="live-message" role="status">
              {message}
            </p>
          </section>
        ) : null}
        {error && (
          <div className="page-error">
            <p className="error" role="alert">
              {error}
            </p>
            <button className="button secondary" onClick={() => void load()}>
              Try loading again
            </button>
          </div>
        )}
        <footer className="bingo-footer">
          <p>
            Made for curious humans by <a href="/">Promptless</a>.
          </p>
          <a href="/bingo-leaderboard">See the provisional leaderboard ↗</a>
        </footer>
      </main>
      {game && panel === "save" && (
        <SavePanel
          game={game}
          cloud={cloud}
          storage={localStorageAdapter}
          onSaved={(next, message) => {
            setCodeRequest(undefined);
            saved(next, message);
          }}
          onClose={close}
          initialCodeRequest={codeRequest}
          onCodeRequested={(request) => {
            setCodeRequest(request);
            if (request) setEmail(request.email);
          }}
        />
      )}
      {game && panel && TELL_BY_ID.has(panel) && (
        <Evidence
          key={panel}
          tell={TELL_BY_ID.get(panel)!}
          game={game}
          storage={storage}
          onSaved={saved}
          onClose={close}
        />
      )}
    </div>
  );
}
