// UCSD's Handshake instance. Postings live behind campus SSO, so this app links
// out to Handshake rather than mirroring postings — there is no public Handshake
// API for a student-built app to pull live listings from.
export const HANDSHAKE_URL = "https://ucsd.joinhandshake.com";
export const HANDSHAKE_POSTINGS_URL = `${HANDSHAKE_URL}/stu/postings`;

// Pre-fills the Handshake search box for a given query, best-effort.
export function handshakeSearchUrl(query) {
  return `${HANDSHAKE_POSTINGS_URL}?query=${encodeURIComponent(query)}`;
}

// Illustrative campus job categories only — not live postings, and pay is
// deliberately not shown here since a made-up number next to a real UCSD
// department would read as a verified wage. Each card links out to a
// Handshake search so students land on real, current openings to apply.
export const SAMPLE_JOBS = [
  {
    id: "hdh-front-desk",
    title: "Front Desk Assistant",
    employer: "Housing · Dining · Hospitality",
    type: "Part-time · On-campus",
    location: "Residence halls",
    blurb:
      "Greet residents, hand out packages, and answer questions at the front desk during evening and weekend shifts.",
  },
  {
    id: "tlc-peer-mentor",
    title: "Peer Research Mentor",
    employer: "Teaching + Learning Commons",
    type: "Part-time · Work-study preferred",
    location: "Geisel Library",
    blurb:
      "Support fellow students with study strategies and research skills in drop-in and scheduled sessions.",
  },
  {
    id: "library-student-assistant",
    title: "Library Student Assistant",
    employer: "UC San Diego Library",
    type: "Part-time · On-campus",
    location: "Geisel Library",
    blurb:
      "Shelve returns, help at the circulation desk, and keep study spaces running smoothly.",
  },
  {
    id: "athletics-marketing-intern",
    title: "Marketing & Social Media Intern",
    employer: "Triton Athletics",
    type: "Internship · On-campus",
    location: "RIMAC Arena",
    blurb:
      "Help plan game-day content and manage social posts for Triton Athletics events.",
  },
  {
    id: "its-help-desk",
    title: "IT Help Desk Student Assistant",
    employer: "Educational Technology Services",
    type: "Part-time · On-campus",
    location: "Price Center",
    blurb:
      "Troubleshoot classroom tech and answer student IT questions in person and over chat.",
  },
  {
    id: "recreation-attendant",
    title: "Recreation Facility Attendant",
    employer: "Recreation · RIMAC & Canyonview",
    type: "Part-time · On-campus",
    location: "RIMAC / Canyonview",
    blurb:
      "Check in members, monitor the weight room and pool deck, and keep facilities running safely.",
  },
];
