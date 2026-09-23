// Trace lanes: faint horizontal session timelines whose events drift toward a
// vanishing point, with an occasional colored tool call and a rare green check.
// Deterministic (seeded) so every visitor sees the same composition; pauses
// off-screen; renders a single still frame under prefers-reduced-motion.
export interface TraceLanesOptions {
  lanes?: number;
  speed?: number;
  alpha?: number;
  laneGap?: number;
  seed?: number;
  fadeLeft?: number;
  labels?: boolean;
  accent?: Record<string, string>;
}

interface TraceEvent { x: number; w: number; kind: string; label?: string }
interface Lane { y: number; speed: number; dim: number; events: TraceEvent[] }

export function mountTraceLanes(canvas: HTMLCanvasElement, opts: TraceLanesOptions = {}): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const cfg = Object.assign<Required<TraceLanesOptions>, TraceLanesOptions>({
    lanes: 9,            // number of timelines
    speed: 22,           // px per second
    alpha: 0.16,         // base alpha for white marks
    laneGap: 34,         // px between lanes
    seed: 7,
    fadeLeft: 0.35,      // fraction of width over which marks fade in from the left
    labels: true,        // draw tool names above some tool-call spans
    accent: { sky: '56,189,248', purple: '177,159,255', green: '39,201,63', amber: '232,163,77' },
  }, opts);

  let seed = cfg.seed;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  let width = 0, height = 0, dpr = 1, lanes: Lane[] = [], raf = 0, last = 0, running = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tool names an agent session actually emits; shown on some tool-call spans.
  const TOOLS = ['Read', 'Edit', 'Bash', 'Grep', 'Glob', 'WebFetch', 'Task', 'mcp__datadog', 'git diff', 'npm test'];
  const makeEvent = (x: number): TraceEvent => {
    const r = rand();
    // Mostly quiet grey message ticks; sometimes a tool call; rarely a pass or a failure.
    if (r < 0.05) return { x, w: 6, kind: 'check' };
    if (r < 0.065) return { x, w: 6, kind: 'fail' };
    if (r < 0.24) {
      const kind = pick(['sky', 'purple', 'amber']);
      return { x, w: 22 + rand() * 44, kind, label: rand() < 0.45 ? pick(TOOLS) : undefined };
    }
    return { x, w: 4 + rand() * 22, kind: 'tick' };
  };

  const fillLane = (lane: Lane) => {
    lane.events = [];
    let x = -rand() * 120;
    while (x < width + 60) {
      const ev = makeEvent(x);
      lane.events.push(ev);
      x += ev.w + 16 + rand() * 90;
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = "10px 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = 'alphabetic';
    seed = cfg.seed;
    const total = cfg.lanes * cfg.laneGap;
    const top = (height - total) / 2 + cfg.laneGap / 2;
    lanes = Array.from({ length: cfg.lanes }, (_, i): Lane => ({
      y: Math.round(top + i * cfg.laneGap) + 0.5,
      speed: cfg.speed * (0.7 + rand() * 0.7),
      dim: 0.55 + rand() * 0.45,
      events: [],
    }));
    lanes.forEach(fillLane);
    draw(0);
  };

  const draw = (dt: number) => {
    ctx.clearRect(0, 0, width, height);
    for (const lane of lanes) {
      // Rail
      ctx.strokeStyle = `rgba(255,255,255,${(cfg.alpha * 0.28 * lane.dim).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lane.y);
      ctx.lineTo(width, lane.y);
      ctx.stroke();
      // Events
      let maxX = -Infinity;
      for (const ev of lane.events) {
        ev.x += lane.speed * dt;
        if (ev.x > maxX) maxX = ev.x;
        const fade = Math.min(1, Math.max(0, ev.x / (width * cfg.fadeLeft)));
        const edge = Math.min(1, Math.max(0, (width - ev.x) / (width * 0.12)));
        const a = cfg.alpha * lane.dim * fade * edge;
        if (a <= 0.005) continue;
        if (ev.kind === 'tick') {
          ctx.fillStyle = `rgba(255,255,255,${(a * 0.9).toFixed(3)})`;
          ctx.fillRect(ev.x, lane.y - 1.5, ev.w, 3);
        } else if (ev.kind === 'fail') {
          ctx.strokeStyle = `rgba(239,68,68,${Math.min(0.8, a * 2.8).toFixed(3)})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(ev.x, lane.y - 3);
          ctx.lineTo(ev.x + 6, lane.y + 3);
          ctx.moveTo(ev.x + 6, lane.y - 3);
          ctx.lineTo(ev.x, lane.y + 3);
          ctx.stroke();
        } else if (ev.kind === 'check') {
          ctx.strokeStyle = `rgba(${cfg.accent.green},${Math.min(0.9, a * 3.2).toFixed(3)})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(ev.x, lane.y);
          ctx.lineTo(ev.x + 2.2, lane.y + 2.4);
          ctx.lineTo(ev.x + 6.5, lane.y - 3.2);
          ctx.stroke();
        } else {
          const rgb = cfg.accent[ev.kind] ?? '255,255,255';
          ctx.fillStyle = `rgba(${rgb},${Math.min(0.85, a * 2.6).toFixed(3)})`;
          ctx.fillRect(ev.x, lane.y - 1.5, ev.w, 3);
          ctx.fillStyle = `rgba(${rgb},${Math.min(0.5, a * 1.4).toFixed(3)})`;
          ctx.fillRect(ev.x - 1, lane.y - 3, 2, 6);
          if (ev.label && cfg.labels) {
            ctx.fillStyle = `rgba(${rgb},${Math.min(0.75, a * 2.2).toFixed(3)})`;
            ctx.fillText(ev.label, ev.x, lane.y - 6);
          }
        }
      }
      // Recycle: drop events past the right edge, spawn on the left.
      lane.events = lane.events.filter((ev) => ev.x < width + 20);
      const firstX = lane.events.length ? Math.min(...lane.events.map((e) => e.x)) : width;
      if (firstX > 40) {
        const ev = makeEvent(firstX - (60 + rand() * 120));
        lane.events.unshift(ev);
      }
    }
  };

  const loop = (t: number) => {
    if (!running) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    draw(dt);
    raf = requestAnimationFrame(loop);
  };

  const start = () => { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  if (reduce) {
    // Advance the still frame a little so it does not look empty at the left edge.
    for (let i = 0; i < 80; i++) draw(0.05);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? start() : stop()));
  }, { threshold: 0.05 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  return () => { stop(); ro.disconnect(); io.disconnect(); };
}
