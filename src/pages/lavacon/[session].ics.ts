// One calendar file per Promptless LavaCon session (/lavacon/<slug>.ics), built
// statically for the "Apple / Outlook" add-to-calendar links on /lavacon.
import type { APIRoute, GetStaticPaths } from 'astro';
import {
  LAVACON_LOCATION,
  calendarDetails,
  lavaconSessions,
  toCalendarUtc,
  type LavaconSession,
} from '@lib/lavacon-sessions';

function escapeValue(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// RFC 5545 caps content lines at 75 octets; continuation lines start with a space.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const segments: string[] = [line.slice(0, 75)];
  for (let pos = 75; pos < line.length; pos += 74) {
    segments.push(' ' + line.slice(pos, pos + 74));
  }
  return segments.join('\r\n');
}

export const getStaticPaths = (() =>
  lavaconSessions.map((session) => ({ params: { session: session.slug }, props: { session } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const session = (props as { session: LavaconSession }).session;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Promptless//LavaCon 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:lavacon-2026-${session.slug}@promptless.ai`,
    `DTSTAMP:${toCalendarUtc(new Date().toISOString())}`,
    `DTSTART:${toCalendarUtc(session.start)}`,
    `DTEND:${toCalendarUtc(session.end)}`,
    `SUMMARY:${escapeValue(session.title)}`,
    `DESCRIPTION:${escapeValue(calendarDetails(session))}`,
    `LOCATION:${escapeValue(LAVACON_LOCATION)}`,
    'URL:https://promptless.ai/lavacon',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Response(lines.map(foldLine).join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${session.slug}.ics"`,
    },
  });
};
