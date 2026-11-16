import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contribute — HealthLLM",
  description: "Three ways to contribute to HealthLLM: add a model, submit eval scores, or add a dataset. Step-by-step guide to how we evaluate every health LLM.",
};

const TIMELINE = [
  {
    step: "01",
    title: "Pull the model",
    desc: "Any model available in Ollama works. One command gets it running locally — no cloud, no API keys.",
    example: "ollama pull meditron:7b",
  },
  {
    step: "02",
    title: "Load a clinical dataset",
    desc: "We use five openly licensed datasets — MedMCQA, MedQA USMLE, PubMedQA, PubHealth, and NCBI Disease. 100 samples each, same seed every time.",
    example: `# example question from MedMCQA
Which vitamin deficiency causes scurvy?
A. Vitamin A  B. Vitamin B12  C. Vitamin C  D. Vitamin D

Answer with one letter only.`,
  },
  {
    step: "03",
    title: "Run prompts at temperature 0",
    desc: "Every prompt runs at temperature 0, seed 42. No randomness — the same model on the same hardware always gives the same answer.",
    example: `python3 scripts/run_evals.py meditron:7b \\
  --samples 100 \\
  --hardware "MacBook Pro M3"`,
  },
  {
    step: "04",
    title: "Score the replies",
    desc: "Each eval has a strict scoring rule. For MCQ we extract the first letter. For entity extraction we compute F1. For JSON we check parse validity.",
    example: `# model replied "The answer is C."
# scorer extracts → "C"
# gold answer     → "C"  ✓ correct`,
  },
  {
    step: "05",
    title: "Compute health score",
    desc: "The seven Tier 1 evals are averaged into a Health Score (0–100) graded A–E. These measure medical knowledge. Tier 2 evals (citation grounding, clinical notes, epistemic humility) run separately with opt-in flags and appear as a second column group — they are never averaged into the Health Score.",
    example: `── Tier 1: Medical Knowledge ──
med_knowledge      61.0%
clinical_reasoning 67.0%
evidence_reasoning 55.0%
claim_verification 48.0%
entity_extraction  44.0% F1
json_reliability   72.0%
consistency        74.0%
─────────────────────────
Health Score       60.1%  →  C

── Tier 2: Deployment Trust (opt-in) ──
citation_grounding  —    (run with --grounding)
notes_score         —    (run with --notes)
abstention          —    (run with --abstention)`,
  },
  {
    step: "06",
    title: "Submit & appear on the leaderboard",
    desc: "Open an issue with the results JSON or use --push to upload directly. Scores are public, reproducible, and linked to the exact run config.",
    example: `python3 scripts/run_evals.py meditron:7b --push \\
  --submitted-by "yourhandle"
# → score live on leaderboard in seconds`,
  },
];

const INVOLVE = [
  {
    icon: "🧬",
    title: "Add a model",
    who: "ML engineers · researchers",
    body: "Know a health LLM not in the catalog? Open an issue with the HuggingFace ID and we'll add it in 24 hours.",
    cta: "Add model →",
    href: "https://github.com/devankit01/healthllm/issues/new?template=add-model-catalog.yml",
  },
  {
    icon: "📊",
    title: "Submit eval scores",
    who: "Anyone with a GPU or Apple Silicon",
    body: "Run our eval script locally on any model and submit the JSON result. All you need is Ollama and Python.",
    cta: "Submit scores →",
    href: "https://github.com/devankit01/healthllm/issues/new?template=add-eval-results.yml",
  },
  {
    icon: "📂",
    title: "Add a dataset",
    who: "Clinicians · NLP researchers",
    body: "Have a clinical NLP dataset not in the catalog? Add it — EHR, radiology, drug safety, genomics, all welcome.",
    cta: "Add dataset →",
    href: "https://github.com/devankit01/healthllm/issues/new?template=add-dataset.yml",
  },
];

export default function ContributePage() {
  return (
    <>
      {/* Hero */}
      <div className="hero-wrap">
        <section className="hero wrap">
          <p className="eyebrow">Open Health AI</p>
          <h1>Contribute to <span>HealthLLM</span></h1>
          <p className="lede">
            Add models, run evals, submit datasets. Everything is open, reproducible, and community-driven.
          </p>
          <div className="cta">
            <a className="btn primary" href="https://github.com/devankit01/healthllm/fork" target="_blank" rel="noopener noreferrer">
              Fork on GitHub
            </a>
            <Link className="btn ghost" href="/leaderboard">View Leaderboard</Link>
          </div>
        </section>
      </div>

      {/* Get involved */}
      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <p className="sec-label">Get involved</p>
        <div className="sec-head">
          <h2>Three ways to contribute</h2>
        </div>
        <div className="involve-grid">
          {INVOLVE.map((c) => (
            <div key={c.title} className="involve-card">
              <span className="involve-icon">{c.icon}</span>
              <div>
                <p className="involve-who">{c.who}</p>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <a className="involve-cta" href={c.href} target="_blank" rel="noopener noreferrer">{c.cta}</a>
              </div>
            </div>
          ))}
        </div>

        {/* prereqs */}
        <div style={{ marginTop: 40 }}>
          <p className="filter-group-label" style={{ marginBottom: 12 }}>What you need</p>
          <div className="prereq-strip">
            {[["🐍","Python 3.10+"],["🦙","Ollama running"],["🟩","Node 22+"],["🐙","GitHub account"],["💾","8+ GB RAM"]].map(([icon, label]) => (
              <div key={label} className="prereq">
                <span className="prereq-icon">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eval timeline */}
      <section className="wrap" style={{ paddingBottom: 80 }}>
        <p className="sec-label">How it works</p>
        <div className="sec-head">
          <h2>How we evaluate every model</h2>
        </div>
        <p className="intro" style={{ marginBottom: 48 }}>
          Six steps, open methodology. Any model that runs in Ollama can be evaluated
          using the same pipeline — same datasets, same temperature, same seed. Results may vary
          across hardware and Ollama versions; use <code>--repeats</code> to measure variance.
        </p>
        <div className="eval-timeline">
          {TIMELINE.map((s) => (
            <div key={s.step} className="timeline-item">
              <div className="timeline-step">{s.step}</div>
              <div className="timeline-body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <pre className="timeline-code"><code>{s.example}</code></pre>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
