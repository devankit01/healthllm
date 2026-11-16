import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology — HealthLLM",
  description: "How HealthLLM evaluates health AI models — two tiers of evals, the Health Score formula, deployment trust scores, and what the numbers don't tell you.",
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

      {/* Two tiers */}
      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <p className="sec-label">The structure</p>
        <h2 className="sec-title">Two tiers, two questions</h2>
        <p className="intro" style={{ marginBottom: 32 }}>
          Think of it like a driving licence. There are two tests — a written exam and a road test. Passing the written exam proves you know the rules. The road test proves you can drive in real traffic. You need both. A model can ace the written exam and still be dangerous on the road.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px" }}>
            <p className="sec-label" style={{ marginBottom: 8 }}>Tier 1 · Health Score</p>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Written exam</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
              <strong>Question:</strong> Does the model know medicine?
            </p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Clean questions, structured inputs</li>
              <li>Medical knowledge + reasoning</li>
              <li>Averaged into a 0–100 Health Score</li>
              <li>Graded A to E</li>
              <li>7 evals, all live today</li>
            </ul>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px" }}>
            <p className="sec-label" style={{ marginBottom: 8 }}>Tier 2 · Deployment Trust</p>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Road test</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
              <strong>Question:</strong> Can this model be trusted in deployment?
            </p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Messy notes, real retrieval tasks</li>
              <li>Hallucination, citation, uncertainty</li>
              <li>Shown separately — not in Health Score</li>
              <li>Does not penalise general models</li>
              <li>3 evals, in progress</li>
            </ul>
          </div>
        </div>
        <div style={{ background: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 10, padding: "14px 18px", fontSize: "13.5px" }}>
          <strong>Why separate?</strong> A well-aligned model that refuses a harmful request or says &ldquo;I don&apos;t know&rdquo; would score lower on the Health Score if safety were mixed in. Keeping them separate lets you see both signals without one distorting the other.
        </div>
      </section>

      {/* How a run works */}
      <section className="wrap" style={{ paddingBottom: 48 }}>
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
        <p className="intro" style={{ marginBottom: 16 }}>
          Each eval has one dataset and one deterministic scoring rule. No model judgment involved.
        </p>
        <div style={{ background: "var(--warn-bg)", border: "1px solid var(--warn-line)", borderRadius: 8, padding: "10px 16px", fontSize: "13px", color: "var(--warn-ink)", marginBottom: 24 }}>
          <strong>Note:</strong> 4 of the 7 evals are multiple-choice questions. The Health Score is 57% driven by MCQ performance. High scores reflect strong medical knowledge on standardised questions — not necessarily real clinical workflow performance. That is what Tier 2 evals are for.
        </div>
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

      {/* Tier 2 evals */}
      <section className="wrap" style={{ paddingBottom: 64 }}>
        <p className="sec-label">Tier 2 · Deployment trust</p>
        <h2 className="sec-title">The road test — not in Health Score</h2>
        <p className="intro" style={{ marginBottom: 32 }}>
          These evals answer a different question: can this model be trusted in a real clinical deployment?
          They run with optional flags, results appear in a separate column group, and they never affect the Health Score.
          If you are building a clinical product, these are the scores that matter most.
        </p>
        <div className="involve-grid">
          <div className="involve-card">
            <span className="involve-icon">📎</span>
            <div>
              <p className="involve-who">Built · awaiting runs · <code>--grounding</code></p>
              <h3>Citation Grounding</h3>
              <p>
                Given a clinical question and 3–5 numbered PubMedQA passages, does the model cite the passages
                that actually support its answer — or does it hallucinate a source?
                Scored as Citation F1 (precision + recall harmonic mean).
              </p>
              <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                Dataset: PubMedQA (MIT) · Metric: Citation F1
              </p>
            </div>
          </div>
          <div className="involve-card" style={{ opacity: 0.7 }}>
            <span className="involve-icon">📋</span>
            <div>
              <p className="involve-who">In design · <code>--notes</code></p>
              <h3>Real Clinical Notes</h3>
              <p>
                Given a messy discharge summary or progress note, the model must extract diagnoses and medications,
                summarise faithfully without inventing facts, answer questions from the note, and admit when
                something is not stated. Four sub-tasks scored separately and combined into a Notes Score.
              </p>
              <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                Dataset: MTSamples (public domain, silver labels) · Metric: Entity F1 + Faithfulness F1 + QA F1 + Abstention score
              </p>
              <p style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--muted)" }}>
                This is the gap the written exam cannot test. See the <a href="https://github.com/devankit01/healthllm/blob/main/docs/PROPOSAL_real_notes_eval.md" target="_blank" rel="noopener noreferrer">design proposal</a>.
              </p>
            </div>
          </div>
          <div className="involve-card" style={{ opacity: 0.7 }}>
            <span className="involve-icon">🤔</span>
            <div>
              <p className="involve-who">In design · <code>--abstention</code></p>
              <h3>Epistemic Humility</h3>
              <p>
                Does the model know what it doesn&apos;t know? Given a clinical note where the answer to a question
                is deliberately absent, does it say &ldquo;not stated&rdquo; — or does it invent an answer?
                A model that always guesses is more dangerous than one that admits uncertainty.
              </p>
              <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                Dataset: subset of clinical notes eval · Metric: Abstention precision + answer precision, harmonic mean
              </p>
            </div>
          </div>
          <div className="involve-card" style={{ opacity: 0.6 }}>
            <span className="involve-icon">🚫</span>
            <div>
              <p className="involve-who">Planned · <code>--refusal</code></p>
              <h3>Harmful Request Refusal</h3>
              <p>
                Does the model refuse requests that could cause harm — dangerous drug combinations, record falsification —
                while still answering legitimate clinical questions?
                Scored as balanced accuracy across harmful and benign prompts.
              </p>
              <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
                Dataset: hand-labelled (in progress) · Metric: Balanced accuracy
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
          <strong>What the leaderboard will look like</strong>
          <pre style={{ marginTop: 12, fontSize: "12px", overflowX: "auto", color: "var(--muted)" }}>{`Model        Health Score  Grade  |  Cite F1  Notes Score  Abstention
─────────────────────────────────────────────────────────────────────
meditron     61.0          C      |  —         —            —
qwen2.5      41.2          D      |  —         —            —
mistral      48.2          D      |  —         —            —

← written exam scores →          | ← road test scores →
   (medical knowledge)              (deployment trust)`}</pre>
          <p style={{ marginTop: 12, fontSize: "13px", color: "var(--muted)" }}>
            The separator shows the two tiers. Left side scores go into the Health Score. Right side scores are independent signals. A model can score C on the left and excellent on the right, or vice versa.
          </p>
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
