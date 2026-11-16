import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology — HealthLLM",
  description: "How HealthLLM evaluates health AI models — datasets, scoring rules, the Health Score formula, and what the numbers don't tell you.",
};

const EVALS = [
  { name: "Medical knowledge",        dataset: "MedMCQA",           metric: "Accuracy",     license: "Apache 2.0" },
  { name: "Clinical reasoning",       dataset: "MedQA USMLE",       metric: "Accuracy",     license: "CC BY 4.0" },
  { name: "Evidence reasoning",       dataset: "PubMedQA",          metric: "Accuracy",     license: "MIT" },
  { name: "Health claim verification",dataset: "PubHealth",         metric: "Accuracy",     license: "MIT" },
  { name: "Disease entity extraction",dataset: "NCBI Disease",      metric: "F1",           license: "CC0 1.0" },
  { name: "Structured output (JSON)", dataset: "(extraction replies)", metric: "% valid",   license: "—" },
  { name: "Answer consistency",       dataset: "(re-ask MCQ)",       metric: "% consistent",license: "—" },
];

const LIMITS = [
  {
    title: "Not clinical validation",
    body: "Exam questions and journal abstracts are not patient care. A score tells you how a model performs on these benchmarks, not whether it is safe or effective for clinical use.",
  },
  {
    title: "Training data contamination",
    body: "These are public datasets. Some models — especially medical fine-tunes — may have been trained on them, inflating their scores.",
  },
  {
    title: "Strict parsing punishes chatty models",
    body: 'A model that explains before answering ("The answer is C because...") is marked the same as one that just says "C". Both pass. But unusual formatting can cause a miss even when the model knows the answer.',
  },
  {
    title: "Scores are hardware-dependent for speed",
    body: "Token throughput is recorded separately and only comparable across submissions on the same hardware. Health Score is hardware-independent.",
  },
  {
    title: "Scores are community-submitted",
    body: "Results are not independently re-run before appearing on the leaderboard. Use --repeats to measure your own variance.",
  },
];

export default function MethodologyPage() {
  return (
    <>
      {/* Hero */}
      <div className="hero-wrap">
        <section className="hero wrap">
          <p className="eyebrow">Open methodology</p>
          <h1>How we evaluate <span>every model</span></h1>
          <p className="lede">
            Same datasets, same temperature, same seed. Any model that runs in Ollama can be evaluated
            and compared against everything on the leaderboard.
          </p>
          <div className="cta">
            <Link className="btn primary" href="/leaderboard">View Leaderboard</Link>
            <Link className="btn ghost" href="/contribute">Run an eval</Link>
          </div>
        </section>
      </div>

      {/* How a run works */}
      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <p className="sec-label">The pipeline</p>
        <h2 className="sec-title">How a run works</h2>
        <p className="intro" style={{ marginBottom: 32 }}>
          <code>scripts/run_evals.py</code> downloads each dataset split from Hugging Face at run time,
          shuffles rows with seed 42, takes the first 100, and sends each question to Ollama at
          temperature 0, seed 42. No randomness. No judge model. Fixed scoring rules.
        </p>
        <div className="prereq-strip">
          {[["🌡️","Temp 0"],["🌱","Seed 42"],["💯","100 samples"],["📐","Fixed rules"],["🏠","100% local"]].map(([icon, label]) => (
            <div key={label} className="prereq">
              <span className="prereq-icon">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7 evals table */}
      <section className="wrap" style={{ paddingBottom: 64 }}>
        <p className="sec-label">Core evals</p>
        <h2 className="sec-title">The 7 scored evals</h2>
        <p className="intro" style={{ marginBottom: 32 }}>
          Each eval has one dataset and one deterministic scoring rule. No model judgment involved.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="lb-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Eval</th>
                <th style={{ textAlign: "left" }}>Dataset</th>
                <th>Metric</th>
                <th>Licence</th>
              </tr>
            </thead>
            <tbody>
              {EVALS.map((e) => (
                <tr key={e.name} className="row">
                  <td><strong>{e.name}</strong></td>
                  <td style={{ color: "var(--muted)" }}>{e.dataset}</td>
                  <td style={{ textAlign: "center" }}><span className="badge badge-type">{e.metric}</span></td>
                  <td style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem" }}>{e.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16, fontSize: "0.85rem", color: "var(--muted)" }}>
          Licences are as listed on each dataset card when last checked. Verify independently before reusing data.
        </p>
      </section>

      {/* Health Score */}
      <section className="wrap" style={{ paddingBottom: 64 }}>
        <p className="sec-label">The score</p>
        <h2 className="sec-title">Health Score and grades</h2>
        <p className="intro" style={{ marginBottom: 32 }}>
          The Health Score is the unweighted mean of all seven evals (0–100).
          Equal weights are a starting choice, not a research finding.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
          {[["A","85+","#16a34a"],["B","70–84","#65a30d"],["C","55–69","#ca8a04"],["D","40–54","#ea580c"],["E","<40","#dc2626"]].map(([grade, range, color]) => (
            <div key={grade} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 24px", textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color }}>{grade}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: 4 }}>{range}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety evals */}
      <section className="wrap" style={{ paddingBottom: 64 }}>
        <p className="sec-label">Safety evals</p>
        <h2 className="sec-title">Opt-in — not in Health Score</h2>
        <p className="intro" style={{ marginBottom: 32 }}>
          Safety evals measure clinical reliability beyond MCQ accuracy. They run with optional flags
          and are shown as a separate column group so they don&apos;t penalise general-purpose models.
        </p>
        <div className="involve-grid">
          <div className="involve-card">
            <span className="involve-icon">📎</span>
            <div>
              <p className="involve-who">Available now · <code>--grounding</code></p>
              <h3>Citation Grounding</h3>
              <p>
                Given a question and 3–5 numbered PubMedQA passages, does the model cite the passages
                that actually support its answer? Scored as Citation F1 (precision × recall harmonic mean).
              </p>
              <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                Dataset: PubMedQA (MIT) · Metric: Citation F1
              </p>
            </div>
          </div>
          <div className="involve-card" style={{ opacity: 0.6 }}>
            <span className="involve-icon">🚫</span>
            <div>
              <p className="involve-who">Coming soon · <code>--refusal</code></p>
              <h3>Harmful Request Refusal</h3>
              <p>
                Does the model refuse requests that could cause harm (dangerous drug combinations,
                record falsification) while still answering legitimate clinical questions?
                Scored as balanced accuracy.
              </p>
              <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                Dataset: hand-labelled (in progress) · Metric: Balanced accuracy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Limits */}
      <section className="wrap" style={{ paddingBottom: 80 }}>
        <p className="sec-label">Be careful</p>
        <h2 className="sec-title">What the scores don&apos;t tell you</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 32 }}>
          {LIMITS.map((l) => (
            <div key={l.title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
              <strong>{l.title}</strong>
              <p style={{ marginTop: 6, color: "var(--muted)", lineHeight: 1.6 }}>{l.body}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 40, fontWeight: 600 }}>
          Full methodology details → <a href="https://github.com/devankit01/healthllm/blob/main/docs/METHODOLOGY.md" target="_blank" rel="noopener noreferrer">docs/METHODOLOGY.md</a>
        </p>
      </section>
    </>
  );
}
