import Icon from "./icons.jsx";
import {
  ALERT_STEPS,
  HANDSHAKE_ALERTS_HELP,
  HANDSHAKE_POSTINGS_URL,
  JOB_SEARCHES,
  handshakeSearchUrl,
} from "./jobs.js";

// Campus jobs live on UCSD's Handshake behind campus sign-in, and its API is
// open only to Career Services partners, so this tab never mirrors postings.
// Every link opens Handshake's live search instead, which stays current on its
// own, and the alerts card hands off to Handshake's real notification feature.
export default function Jobs() {
  return (
    <section>
      <div className="tt-page-heading">
        <div>
          <p className="tt-eyebrow">PAY THE BILLS</p>
          <h1>Campus jobs, one tap away.</h1>
          <p>
            Every search below opens Handshake live, so you’re always looking at
            what’s open right now — not a copy that went stale.
          </p>
        </div>
        <Icon name="briefcase" size={35} />
      </div>

      <a
        className="tt-jobs-cta"
        href={HANDSHAKE_POSTINGS_URL}
        target="_blank"
        rel="noreferrer"
      >
        <span>
          <Icon name="briefcase" size={22} />
        </span>
        <span className="tt-jobs-cta-copy">
          <strong>Browse all jobs on Handshake</strong>
          <span>Sign in with your UCSD account to see every opening</span>
        </span>
        <Icon name="arrow" size={18} />
        <span className="tt-sr-only"> (opens in a new tab)</span>
      </a>

      <div className="tt-feed-heading">
        <div>
          <p className="tt-eyebrow">START WITH A SEARCH</p>
          <h2>What kind of hours?</h2>
        </div>
      </div>
      <div className="tt-jobs-grid">
        {JOB_SEARCHES.map((search) => (
          <a
            className="tt-job-tile"
            key={search.id}
            href={handshakeSearchUrl(search.query)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="tt-job-tile-icon">
              <Icon name={search.icon} size={20} />
            </span>
            <span className="tt-job-tile-copy">
              <strong>{search.label}</strong>
              <span>{search.blurb}</span>
            </span>
            <Icon name="arrow" size={17} />
            <span className="tt-sr-only"> (opens in a new tab)</span>
          </a>
        ))}
      </div>

      <section className="tt-panel tt-alerts">
        <div className="tt-alerts-head">
          <span className="tt-alerts-icon">
            <Icon name="sparkle" size={22} />
          </span>
          <div>
            <p className="tt-eyebrow">DON’T REFRESH. GET TOLD.</p>
            <h2>Hear about new jobs first.</h2>
            <p>
              Handshake can email or text you the moment something matching your
              search goes up. It takes about a minute to set up.
            </p>
          </div>
        </div>
        <ol className="tt-alert-steps">
          {ALERT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="tt-alerts-actions">
          <a
            className="tt-button"
            href={HANDSHAKE_POSTINGS_URL}
            target="_blank"
            rel="noreferrer"
          >
            Set up alerts on Handshake
            <Icon name="arrow" size={17} />
            <span className="tt-sr-only"> (opens in a new tab)</span>
          </a>
          <a
            className="tt-text-button"
            href={HANDSHAKE_ALERTS_HELP}
            target="_blank"
            rel="noreferrer"
          >
            Handshake’s guide
            <span className="tt-sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>

      <div className="tt-jobs-note">
        <Icon name="shield" size={18} />
        <p>
          Tritons Thrifts doesn’t copy Handshake listings. Postings sit behind
          your UCSD sign-in and Handshake’s data access is limited to campus
          Career Services, so pay, deadlines and posting dates stay on Handshake
          where they’re accurate.
        </p>
      </div>
    </section>
  );
}
