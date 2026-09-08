import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarFile, googleCalendarUrl } from "../src/mobile/calendar.js";

test("calendar handoff converts local offset to UTC and cannot inject an event", () => {
  const meetup = {
    id: "pickup-1",
    start: "2026-09-12T14:30:00-07:00",
    spot: "Geisel, UCSD;Library\nBEGIN:VEVENT",
  };
  const file = calendarFile(
    meetup,
    "Shirt\nEND:VEVENT",
    "2026-09-07T12:00:00Z",
  );
  assert.match(file, /DTSTART:20260912T213000Z/);
  assert.match(file, /DTEND:20260912T220000Z/);
  assert.equal(
    file.split("\r\n").filter((line) => line === "BEGIN:VEVENT").length,
    1,
  );
  assert.match(file, /LOCATION:Geisel\\, UCSD\\;Library\\nBEGIN:VEVENT/);
  const url = new URL(googleCalendarUrl(meetup, "Shirt & jacket"));
  assert.equal(
    url.searchParams.get("text"),
    "Tritons Thrifts · Shirt & jacket",
  );
  assert.equal(
    url.searchParams.get("dates"),
    "20260912T213000Z/20260912T220000Z",
  );
});

test("calendar lines fold without breaking UTF-8 or exceeding 75 octets", () => {
  const file = calendarFile(
    { id: "1", start: "2026-09-12T10:00:00Z", spot: "Geisel" },
    "衣服".repeat(100),
  );
  for (const line of file.split("\r\n"))
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.ok(file.replace(/\r\n /g, "").includes("衣服".repeat(100)));
});

test("invalid dates fail before constructing an event", () => {
  assert.throws(
    () =>
      calendarFile({ id: "1", start: "not a date", spot: "Geisel" }, "Shirt"),
    /valid pickup/,
  );
});
