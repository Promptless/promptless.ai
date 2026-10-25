import { useEffect, useState, useRef, type FormEvent } from "react";
import Modal from "./BingoModal";
import {
  cloudRequest,
  requestCode,
  verifyCode,
  type BingoCloud,
  type RemoteBoard,
} from "../../lib/bingo/cloud";
import type { Game } from "../../lib/bingo/game";
import type { LocalBingoStorage } from "../../lib/bingo/storage";

export interface EmailCodeRequest {
  email: string;
  challenge: string;
  resendAfter: number;
  requestedAt: number;
}

export default function SavePanel({
  game,
  cloud,
  storage,
  onSaved,
  onClose,
  initialCodeRequest,
  onCodeRequested,
}: {
  game: Game;
  cloud: BingoCloud;
  storage: LocalBingoStorage;
  onSaved: (game: Game, message: string) => void;
  onClose: () => void;
  initialCodeRequest?: EmailCodeRequest;
  onCodeRequested: (request: EmailCodeRequest) => void;
}) {
  const [step, setStep] = useState<"email" | "code" | "account" | "choose">(
    cloud.state.email ? "account" : initialCodeRequest ? "code" : "email",
  );
  const [email, setEmail] = useState(
    cloud.state.email || initialCodeRequest?.email || game.email,
  );
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState(
    initialCodeRequest?.challenge || "",
  );
  const [cooldown, setCooldown] = useState(
    initialCodeRequest
      ? Math.max(
          0,
          Math.ceil(
            (initialCodeRequest.requestedAt +
              initialCodeRequest.resendAfter * 1000 -
              Date.now()) /
              1000,
          ),
        )
      : 0,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remote, setRemote] = useState<RemoteBoard | null>(null);
  const [backups, setBackups] = useState<Game[]>([]);
  const [backupIndex, setBackupIndex] = useState(0);
  const previous = backups[backupIndex];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    void storage
      .loadBackups()
      .then(setBackups)
      .catch(() =>
        setError("Couldn’t read local backups. Close this panel and retry."),
      );
  }, [storage]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function perform(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Please try again. Your local board is safe.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function connect(address: string) {
    const saved = await cloud.connect(game, address);
    if (!saved) {
      onSaved(game, "Email verified. Your board is saving privately.");
      return;
    }
    if (!Object.keys(game.photos).length) {
      onSaved(
        await cloud.restore(game, saved),
        "Your saved board is ready. Welcome back!",
      );
      return;
    }
    setRemote(saved);
    setStep("choose");
  }
  function send(event?: FormEvent) {
    event?.preventDefault();
    void perform(async () => {
      const sent = await requestCode(email);
      onCodeRequested({ email, ...sent, requestedAt: Date.now() });
      setChallenge(sent.challenge);
      setCooldown(sent.resendAfter);
      setCode("");
      setStep("code");
    });
  }
  function verify(event: FormEvent) {
    event.preventDefault();
    void perform(async () => {
      const verified = await verifyCode(challenge, code);
      setEmail(verified.email);
      setCode("");
      setChallenge("");
      setStep("account");
      await connect(verified.email);
    });
  }
  return (
    <Modal
      title={
        step === "code"
          ? "Check your inbox"
          : step === "choose"
            ? "Which board shall we continue?"
            : "Save your work"
      }
      onClose={onClose}
      locked={busy}
    >
      {step === "email" && (
        <form onSubmit={send}>
          <p>
            Play now, pick it up later—even on another device. We’ll email you a
            six-digit code. No password.
          </p>
          <label htmlFor="save-email">Your email</label>
          <input
            id="save-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <p className="fine">
            After verification, your board and photos will be saved privately.
            Your email is used to sign in; this does not subscribe you to
            marketing.
          </p>
          <button className="button primary full" disabled={busy}>
            {busy ? "Sending code…" : "Email me a code"}
          </button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={verify}>
          <p>
            Enter the code sent to <strong>{email}</strong>. It expires in 10
            minutes.
          </p>
          <label htmlFor="verification-code">Verification code</label>
          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={busy}
          />
          <button
            className="button primary full"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Verifying…" : "Verify & save"}
          </button>
          <div className="button-row">
            <button
              type="button"
              className="text-button"
              disabled={busy || cooldown > 0}
              onClick={() => send()}
            >
              {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => {
                setChallenge("");
                setCode("");
                setError("");
                setStep("email");
              }}
            >
              Change email
            </button>
          </div>
        </form>
      )}
      {step === "account" && (
        <>
          <p>
            Verified as <strong>{email}</strong>. Your photos are private.
          </p>
          <p className="fine">
            A local copy stays on this browser. Saved boards expire after 30
            days without a change.
          </p>
          <button
            className="button primary full"
            disabled={busy}
            onClick={() => void perform(() => connect(email))}
          >
            Save or restore my board
          </button>
          <button
            className="text-button"
            disabled={busy || cloud.state.phase === "saving"}
            onClick={() =>
              void perform(async () => {
                await cloud.signOut();
                onClose();
              })
            }
          >
            Sign out of saving
          </button>
          <hr />
          {!confirmDelete ? (
            <button
              className="text-button danger"
              disabled={busy || cloud.state.phase === "saving"}
              onClick={() =>
                void perform(async () => {
                  setRemote(await cloudRequest<RemoteBoard | null>("board"));
                  setConfirmDelete(true);
                })
              }
            >
              Delete saved copy
            </button>
          ) : (
            <div className="confirm">
              <p>
                Delete the saved board and all{" "}
                {Object.keys(remote?.photos || {}).length} photos from your
                account? Your local copy stays on this browser.
              </p>
              <button
                className="button danger-button"
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    if (remote)
                      await cloudRequest("board", {
                        method: "DELETE",
                        headers: {
                          "X-Bingo-Board": remote.id,
                          "If-Match": String(remote.revision),
                        },
                      });
                    await storage.saveCheckpoint(game.token, null);
                    await cloud.signOut();
                    onClose();
                  })
                }
              >
                Delete saved board
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
              >
                Keep saved board
              </button>
            </div>
          )}
        </>
      )}
      {step === "choose" && remote && (
        <>
          <p>
            This device has {Object.keys(game.photos).length} finds. Your saved
            board has {Object.keys(remote.photos).length} finds.
          </p>
          <p>
            Continuing the saved board keeps a backup of this device’s board
            here. You can restore that local backup from this panel.
          </p>
          <button
            className="button primary full"
            disabled={busy}
            onClick={() =>
              void perform(async () =>
                onSaved(
                  await cloud.restore(game, remote),
                  "Saved board restored. Your previous local board is backed up here.",
                ),
              )
            }
          >
            Continue saved board
          </button>
          <button
            className="button secondary full"
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                await cloud.signOut();
                onClose();
              })
            }
          >
            Keep playing this local board
          </button>
        </>
      )}
      {previous && (
        <>
          {backups.length > 1 && (
            <>
              <label htmlFor="local-backup">Local backup</label>
              <select
                id="local-backup"
                value={backupIndex}
                onChange={(event) => setBackupIndex(Number(event.target.value))}
                disabled={busy}
              >
                {backups.map((backup, index) => (
                  <option
                    key={`${backup.token}:${backup.revision}`}
                    value={index}
                  >
                    Backup {backups.length - index} ·{" "}
                    {Object.keys(backup.photos).length} finds
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            className="text-button"
            disabled={busy || cloud.state.phase === "saving"}
            onClick={() =>
              void perform(async () => {
                if (cloud.state.email) await cloud.signOut();
                onSaved(
                  await storage.restore(game, previous, null),
                  "Previous local board restored. Online saving is paused.",
                );
              })
            }
          >
            Restore previous local board ({Object.keys(previous.photos).length}{" "}
            finds)
          </button>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="text-button" disabled={busy} onClick={onClose}>
        Keep playing
      </button>
    </Modal>
  );
}
