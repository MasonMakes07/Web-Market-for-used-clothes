// Converts a valid instant into the compact UTC date used by both calendar formats.
function stamp(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Choose a valid pickup date and time.");
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

// Escapes user-entered calendar text to prevent injecting extra event properties.
function escapeText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

// Folds UTF-8 content lines at the iCalendar 75-octet boundary.
function fold(line) {
  let result = "",
    length = 0;
  for (const character of line) {
    const bytes = new TextEncoder().encode(character).length;
    if (length + bytes > 75) {
      result += "\r\n ";
      length = 1;
    }
    result += character;
    length += bytes;
  }
  return result;
}

// Builds an explicit one-time Google Calendar handoff, never calendar synchronization.
export function googleCalendarUrl(meetup, title) {
  const end = new Date(new Date(meetup.start).getTime() + 30 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Tritons Thrifts · ${title}`,
    dates: `${stamp(meetup.start)}/${stamp(end)}`,
    location: `${meetup.spot}, UC San Diego`,
    details:
      "Campus pickup arranged in Tritons Thrifts. Check your conversation for changes. Payment is arranged between students.",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Produces a portable event with a stable ID and UTC times, including daylight saving offsets.
export function calendarFile(meetup, title, now = new Date()) {
  const end = new Date(new Date(meetup.start).getTime() + 30 * 60 * 1000);
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tritons Thrifts//Campus Pickups//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${escapeText(meetup.id)}@triton-thrift.local`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(meetup.start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeText(`Tritons Thrifts · ${title}`)}`,
      `LOCATION:${escapeText(`${meetup.spot}, UC San Diego`)}`,
      "DESCRIPTION:Check your Tritons Thrifts conversation for pickup changes.",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}

// Starts an .ics download for Apple Calendar and other calendar clients.
export function downloadCalendar(meetup, title) {
  const url = URL.createObjectURL(
    new Blob([calendarFile(meetup, title)], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "triton-thrift-pickup.ics";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
