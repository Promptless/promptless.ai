/** SDK stop() signals abort; sendMessage/regenerate settle after final callbacks.
 * Wait for that settlement before mutating history or starting another request.
 */
export class ChatActions {
  private revision = 0;
  private active?: { revision: number; settled: Promise<void> };

  get acceptsEvents() { return this.active?.revision === this.revision; }

  async run(stop: () => Promise<void>, action: () => void | Promise<void>) {
    const revision = ++this.revision;
    const previous = this.active;
    if (previous) {
      await stop();
      await previous.settled;
    }
    // Rapid clicks may replace an action that is still waiting for the abort.
    if (revision !== this.revision) return;
    let settle!: () => void;
    const active = { revision, settled: new Promise<void>((resolve) => { settle = resolve; }) };
    this.active = active;
    try { await action(); }
    finally {
      settle();
      if (this.active === active) this.active = undefined;
    }
  }
}
