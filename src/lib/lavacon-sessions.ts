// Promptless sessions at LavaCon 2026, shared by the /lavacon page and the
// per-session .ics files (src/pages/lavacon/[session].ics.ts). Titles and times
// come from the LavaCon 2026 program (lavacon.org/2026-conference-program).
// `start`/`end` are UTC: Charlotte is on EDT (UTC-4) until November 1.

export interface LavaconSession {
  slug: string;
  title: string;
  when: string;
  body: string;
  start: string;
  end: string;
}

// The conference venue, per lavacon.org/hotel.
export const LAVACON_LOCATION = 'Le Méridien / Sheraton Charlotte, 555 S McDowell St, Charlotte, NC 28204';

export const lavaconSessions: LavaconSession[] = [
  {
    slug: 'docs-audit-workshop',
    title: 'Does Your Documentation Survive an AI Assistant? A Hands-On Docs Audit',
    when: 'Free pre-conference workshop with Manny Silva and Prithvi Ramakrishnan · Sunday, October 25 · 8:00 AM – 12:00 PM',
    body: 'Bring your real content and run retrieval and answer-accuracy tests against it. Learn to tell retrieval, content, and structure failures apart, and leave with a repeatable audit you can rerun with your team every release.',
    start: '2026-10-25T12:00:00Z',
    end: '2026-10-25T16:00:00Z',
  },
  {
    slug: 'self-healing-docs-talk',
    title: 'From 2 AM Failure to 8 AM Fix: Self-Healing Docs, Agent Instructions Included',
    when: 'Monday, October 26 · 11:15 AM – 12:00 PM',
    body: 'Follow a product failure through a self-healing documentation loop: detect, diagnose, repair, verify, and report. See how to set up systems that catch and fix documentation drift across APIs, links, screenshots, and agent instructions.',
    start: '2026-10-26T15:15:00Z',
    end: '2026-10-26T16:00:00Z',
  },
];

/** 2026-10-25T12:00:00Z -> 20261025T120000Z (the form both ICS and Google Calendar use). */
export function toCalendarUtc(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
}

export function calendarDetails(session: LavaconSession): string {
  return `${session.body}\n\nPromptless at LavaCon 2026: https://promptless.ai/lavacon`;
}

export function googleCalendarUrl(session: LavaconSession): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${toCalendarUtc(session.start)}/${toCalendarUtc(session.end)}`,
    details: calendarDetails(session),
    location: LAVACON_LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
