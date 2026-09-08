import Icon from "./icons.jsx";
import {
  HANDSHAKE_POSTINGS_URL,
  SAMPLE_JOBS,
  handshakeSearchUrl,
} from "./jobs.js";

// Campus jobs live on UCSD's Handshake, behind campus sign-in, with no public
// API to mirror postings here — so this tab links out to Handshake to apply
// and to browse whatever is actually open right now.
export default function Jobs() {
  return (
    <section>
      <div className="tt-page-heading">
        <div>
          <p className="tt-eyebrow">PAY THE BILLS</p>
          <h1>Campus jobs, one tap away.</h1>
          <p>
            A few kinds of jobs Tritons take on campus. Apply on Handshake —
            that’s where the real, current openings live.
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
          <span>Sign in with your UCSD account to see live openings</span>
        </span>
        <Icon name="arrow" size={18} />
        <span className="tt-sr-only"> (opens in a new tab)</span>
      </a>
      <div className="tt-jobs-note">
        <Icon name="shield" size={18} />
        <p>
          The jobs below are sample listings to show what this tab does.
          Handshake postings change constantly and this preview does not have
          access to pull them in live — tap Apply to search Handshake for the
          real thing, including current pay.
        </p>
      </div>
      <div className="tt-jobs-grid">
        {SAMPLE_JOBS.map((job) => (
          <article className="tt-job-card" key={job.id}>
            <span className="tt-sample-badge">Sample listing</span>
            <h3>{job.title}</h3>
            <p className="tt-job-employer">{job.employer}</p>
            <div className="tt-tags">
              <span>{job.type}</span>
              <span>Pay listed on Handshake</span>
            </div>
            <p className="tt-job-location">
              <Icon name="pin" size={15} /> {job.location}
            </p>
            <p className="tt-job-blurb">{job.blurb}</p>
            <a
              className="tt-button tt-button-secondary tt-full"
              href={handshakeSearchUrl(job.title)}
              target="_blank"
              rel="noreferrer"
            >
              Apply on Handshake
              <Icon name="arrow" size={17} />
              <span className="tt-sr-only"> (opens in a new tab)</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
