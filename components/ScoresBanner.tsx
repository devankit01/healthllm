import Link from "next/link";

export default function ScoresBanner() {
  return (
    <div className="scores-banner wrap">
      <span className="scores-banner-icon">ℹ️</span>
      <div className="scores-banner-body">
        <strong>About these scores</strong>
        <span className="scores-banner-sep">·</span>
        Scores compare models under the same questions and settings — they are a shortlisting tool, not clinical validation.
        This site holds no patient data.
        Compliance with HIPAA or other regulations depends on how you deploy a model, where PHI goes, and the licence terms — that review is yours to do.
        <Link className="scores-banner-link" href="/methodology">How scores work →</Link>
      </div>
    </div>
  );
}
