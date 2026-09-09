// UCSD's Handshake instance. Student postings live behind campus SSO, and
// Handshake's EDU API is limited to Career Services partners at the institution
// level, so this app cannot mirror postings or their dates. Instead of copying
// stale listings, every tile below opens Handshake's own live search, which is
// current by construction, and the alert steps point students at Handshake's
// real "notify me about new jobs like this" feature.
export const HANDSHAKE_URL = "https://ucsd.joinhandshake.com";
export const HANDSHAKE_POSTINGS_URL = `${HANDSHAKE_URL}/stu/postings`;
export const HANDSHAKE_ALERTS_HELP =
  "https://support.joinhandshake.com/hc/en-us/articles/218693388-Saving-Job-Searches-and-Receiving-Job-Alerts";

// Pre-fills the Handshake search box. If the parameter name ever changes, the
// link still lands on the postings search, so it degrades to something correct.
export function handshakeSearchUrl(query) {
  return `${HANDSHAKE_POSTINGS_URL}?query=${encodeURIComponent(query)}`;
}

// Ways students actually narrow the campus job board. Each one is a live search,
// not a snapshot, so a job posted a minute ago is already in the results.
export const JOB_SEARCHES = [
  {
    id: "on-campus",
    icon: "pin",
    label: "On campus",
    blurb: "Shifts you can walk to between classes.",
    query: "on-campus",
  },
  {
    id: "part-time",
    icon: "calendar",
    label: "Part-time",
    blurb: "Hours that fit around a full course load.",
    query: "part-time",
  },
  {
    id: "work-study",
    icon: "bag",
    label: "Work-study",
    blurb: "Roles that take your work-study award.",
    query: "work study",
  },
  {
    id: "internships",
    icon: "briefcase",
    label: "Internships",
    blurb: "Terms and summers that build the résumé.",
    query: "internship",
  },
  {
    id: "research",
    icon: "search",
    label: "Research",
    blurb: "Lab and assistant openings across campus.",
    query: "research assistant",
  },
  {
    id: "summer",
    icon: "sparkle",
    label: "Summer",
    blurb: "Something lined up before the quarter ends.",
    query: "summer",
  },
];

// Handshake's own alert flow, which is the only thing that can actually tell a
// student the moment a new job appears. Steps mirror Handshake's help article.
export const ALERT_STEPS = [
  "Open Jobs on Handshake and filter for what you want.",
  "In the banner above the results, choose “Notify me about new jobs like this.”",
  "Open Manage notifications and name the search.",
  "Pick email or text, and daily or weekly.",
];
