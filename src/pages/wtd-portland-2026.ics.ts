import type { APIRoute } from 'astro';

function toICSDateTime(date: string, decimalHour: number): string {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  return `${date}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
}

function escapeValue(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const segments: string[] = [line.slice(0, 75)];
  let pos = 75;
  while (pos < line.length) {
    segments.push(' ' + line.slice(pos, pos + 74));
    pos += 74;
  }
  return segments.join('\r\n');
}

function prop(key: string, value: string): string {
  return foldLine(`${key}:${value}`);
}

const DTSTAMP = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

interface ICSEvent {
  uid: string;
  date: string;
  startHour: number;
  endHour: number;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
}

const events: ICSEvent[] = [
  // Saturday May 2
  {
    uid: 'sat-lunch@promptless.ai',
    date: '20260502',
    startHour: 12.5,
    endHour: 13 + 40 / 60,
    summary: 'WTD: Lunch at Nob Hill Food Carts',
    location: 'Nob Hill Food Carts, Portland, OR',
    url: 'https://www.writethedocs.org/conf/portland/2026/hike/',
  },
  {
    uid: 'sat-hike@promptless.ai',
    date: '20260502',
    startHour: 14,
    endHour: 17,
    summary: 'WTD: Conference Hike',
    url: 'https://www.writethedocs.org/conf/portland/2026/hike/',
  },
  // Sunday May 3
  {
    uid: 'sun-writing@promptless.ai',
    date: '20260503',
    startHour: 9,
    endHour: 17,
    summary: 'WTD: Writing Day',
    location: 'Revolution Hall, Portland, OR',
    url: 'https://www.writethedocs.org/conf/portland/2026/writing-day/',
  },
  {
    uid: 'sun-reception@promptless.ai',
    date: '20260503',
    startHour: 17,
    endHour: 19,
    summary: 'WTD: Sunday Reception',
    location: 'Revolution Hall, Portland, OR',
  },
  {
    uid: 'sun-pl-dinner@promptless.ai',
    date: '20260503',
    startHour: 19,
    endHour: 21,
    summary: 'Promptless Dinner at East Burn',
    description: 'RSVP at https://luma.com/1m13xfc3',
    location: 'East Burn, 1800 E Burnside St, Portland, OR 97214',
  },
  // Monday May 4
  {
    uid: 'mon-marthas@promptless.ai',
    date: '20260504',
    startHour: 10,
    endHour: 12,
    summary: "Coffee & Workshops at Martha's with Promptless",
    description:
      '10:00 AM — Context Engineering for Agents (Manny Silva)\n' +
      '10:45 AM — Docs as Code: Starting from Scratch (Mike Jang)\n' +
      '11:30 AM — Docs Observability: Measure Less, Learn More (Mano Toth)',
    location: "Martha's, Portland, OR",
  },
  {
    uid: 'mon-pl-dinner@promptless.ai',
    date: '20260504',
    startHour: 17.5,
    endHour: 19,
    summary: 'Promptless Dinner at Jupiter NEXT',
    description: 'RSVP at https://luma.com/tpl91l3a',
    location: 'Jupiter NEXT (downstairs), Portland, OR',
  },
  {
    uid: 'mon-social@promptless.ai',
    date: '20260504',
    startHour: 19,
    endHour: 21,
    summary: 'WTD: Monday Night Social',
    location: 'Jupiter NEXT (upstairs), Portland, OR',
  },
  // Tuesday May 5
  {
    uid: 'tue-doc-audit@promptless.ai',
    date: '20260505',
    startHour: 9,
    endHour: 12,
    summary: "Manny's Doc Audit — Book a free 15-min slot",
    description: 'Book a free 15-minute documentation audit with Manny Silva at https://cal.com/team/promptless/manny-docs-process-audit',
    location: 'Revolution Hall, Portland, OR',
    url: 'https://cal.com/team/promptless/manny-docs-process-audit',
  },
];

export const GET: APIRoute = () => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    prop('PRODID', '-//Promptless//WTD Portland 2026//EN'),
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    prop('X-WR-CALNAME', 'Promptless at WTD Portland 2026'),
    'X-WR-TIMEZONE:America/Los_Angeles',
  ];

  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(prop('UID', ev.uid));
    lines.push(prop('DTSTAMP', DTSTAMP));
    lines.push(foldLine(`DTSTART;TZID=America/Los_Angeles:${toICSDateTime(ev.date, ev.startHour)}`));
    lines.push(foldLine(`DTEND;TZID=America/Los_Angeles:${toICSDateTime(ev.date, ev.endHour)}`));
    lines.push(prop('SUMMARY', escapeValue(ev.summary)));
    if (ev.description) lines.push(prop('DESCRIPTION', escapeValue(ev.description)));
    if (ev.location) lines.push(prop('LOCATION', escapeValue(ev.location)));
    if (ev.url) lines.push(prop('URL', ev.url));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="promptless-wtd-portland-2026.ics"',
    },
  });
};
