import { useCallback, useEffect, useRef, useState } from "react";
import {
  leaderboardSchema,
  type Leaderboard as Snapshot,
} from "../../lib/bingo/leaderboard";

export default function Leaderboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    const request = new AbortController();
    controller.current = request;
    try {
      const response = await fetch("/bingo-leaderboard.json", {
        credentials: "omit",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]),
      });
      if (!response.ok) throw new Error("Leaderboard unavailable");
      const data = leaderboardSchema.parse(await response.json());
      if (!request.signal.aborted) {
        setSnapshot(data);
        setError(false);
      }
    } catch {
      if (!request.signal.aborted) setError(true);
    } finally {
      pending.current = false;
      if (!request.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    return () => {
      window.clearInterval(interval);
      controller.current?.abort();
    };
  }, [refresh]);

  const updated = snapshot ? new Date(snapshot.updatedAt) : null;
  return (
    <section className="standings" aria-labelledby="standings-title">
      <div className="standings-top">
        <div>
          <h2 id="standings-title">The field notes</h2>
          <p>
            {snapshot
              ? `${snapshot.entries.length} saved ${snapshot.entries.length === 1 ? "board" : "boards"}`
              : "Saved boards"}{" "}
            <span aria-hidden="true">·</span> Photos awaiting review
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>{" "}
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="snapshot-status" role="status" aria-live="polite">
        {error ? (
          <p className="standings-error">
            {snapshot
              ? "The latest update is unavailable. Showing the previous snapshot below."
              : "We couldn’t load the standings. Try refreshing in a minute."}
          </p>
        ) : !snapshot ? (
          <p className="standings-loading">Loading saved boards…</p>
        ) : null}
      </div>
      {snapshot && snapshot.entries.length === 0 && (
        <div className="standings-empty">
          <span aria-hidden="true">✳</span>
          <h3>The field is open.</h3>
          <p>
            No saved boards to show yet. Play a card, then verify your email to
            save your finds.
          </p>
          <a href="/bingo">
            Start finding AI Tells <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
      {snapshot && snapshot.entries.length > 0 && (
        <div className="standings-table-wrap">
          <table>
            <caption className="visually-hidden">
              Provisional AI Tells Bingo standings. Ranked by Bingo lines, then
              AI Tells found. Matching scores share a rank.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="rank-col">
                  Rank
                </th>
                <th scope="col">Player</th>
                <th scope="col" className="score-col">
                  Bingo
                  <br className="mobile-break" /> lines
                </th>
                <th scope="col" className="score-col">
                  AI Tells
                  <br className="mobile-break" /> found
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshot.entries.map((entry) => (
                <tr
                  key={entry.alias}
                  className={
                    entry.rank === 1 && entry.tellsFound > 0
                      ? "leading-row"
                      : ""
                  }
                >
                  <td className="rank-col">
                    <span className="rank-number">{entry.rank}</span>
                  </td>
                  <th scope="row" className="player-name">
                    <span>Player</span>{" "}
                    <span className="player-code">{entry.alias.slice(7)}</span>
                  </th>
                  <td className="score-col">
                    <span className="line-score">{entry.bingoLines}</span>
                  </td>
                  <td className="score-col">
                    <span className="tell-score">
                      {entry.tellsFound}
                      <span className="score-total"> / 24</span>
                    </span>
                    <span className="finds-track" aria-hidden="true">
                      <span
                        style={{ width: `${(entry.tellsFound / 24) * 100}%` }}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="standings-bottom">
        <p>
          Most Bingo lines first, then AI Tells found. Matching scores share a
          rank.
        </p>
        <p className="update-time">
          {updated ? (
            <>
              Snapshot:{" "}
              <time dateTime={snapshot!.updatedAt}>
                {updated.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </time>
            </>
          ) : (
            "Updates about every minute"
          )}
        </p>
      </div>
    </section>
  );
}
