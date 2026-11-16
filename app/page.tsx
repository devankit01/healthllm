import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import ScoresBanner from "@/components/ScoresBanner";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ count: modelCount }, { count: datasetCount }] = await Promise.all([
    supabase.from("health_models").select("*", { count: "exact", head: true }),
    supabase.from("health_datasets").select("*", { count: "exact", head: true }),
  ]);

  const mc = modelCount ?? 0;
  const dc = datasetCount ?? 0;

  return (
    <>
      {/* Hero */}
      <div className="hero-wrap">
        <section className="hero wrap">
          <p className="eyebrow">Open Health AI</p>
          <h1>The benchmark for <span>health AI</span></h1>
          <p className="lede">
            Browse {mc} open health LLMs and {dc} datasets. Compare models under the same questions and settings.
            Compare clinical reasoning, medical knowledge, and RAG reliability — all at temperature&nbsp;0.
          </p>
          <div className="cta">
            <Link className="btn primary" href="/models">Browse Models</Link>
            <Link className="btn ghost" href="/datasets">Browse Datasets</Link>
            <Link className="btn ghost" href="/leaderboard">Leaderboard</Link>
          </div>
          <dl className="stats-strip">
            <div className="stat"><dt>{mc}</dt><dd>Health LLMs</dd></div>
            <div className="stat"><dt>{dc}</dt><dd>Datasets</dd></div>
            <div className="stat"><dt>7</dt><dd>Clinical evals</dd></div>
            <div className="stat"><dt>0°</dt><dd>Temperature — always</dd></div>
          </dl>
        </section>
      </div>

      <ScoresBanner />

      {/* Hub teasers */}
      <section className="wrap hub-teasers" aria-label="Browse">
        <div className="teaser-grid">
          <Link className="teaser-card" href="/models">
            <div className="teaser-icon">🧠</div>
            <div>
              <h3>Health LLMs</h3>
              <p>{mc} models — Meditron, OpenBioLLM, MedGemma, BioBERT, ClinicalBERT, MedCPT and more.</p>
              <span className="teaser-link">Browse all models →</span>
            </div>
          </Link>
          <Link className="teaser-card" href="/datasets">
            <div className="teaser-icon">📊</div>
            <div>
              <h3>Health Datasets</h3>
              <p>{dc} datasets — Medical QA, NER, Radiology, Clinical Records, Drug Safety, Genomics and more.</p>
              <span className="teaser-link">Browse all datasets →</span>
            </div>
          </Link>
          <Link className="teaser-card" href="/leaderboard">
            <div className="teaser-icon">📈</div>
            <div>
              <h3>Leaderboard</h3>
              <p>Community-submitted scores across 7 clinical benchmarks. Same questions, same settings for every model.</p>
              <span className="teaser-link">View leaderboard →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Why */}
      <section id="why" aria-labelledby="why-h">
        <div className="wrap">
          <p className="sec-label">The problem</p>
          <div className="sec-head"><h2 id="why-h">Why this exists</h2></div>
          <div className="why-grid">
            {[
              { icon: "🏥", title: "Health AI needs transparency", body: "Models are being deployed in clinical tools, triage systems, and patient-facing apps. Without open benchmarks it is impossible to compare models or understand their failure modes on health data." },
              { icon: "🔬", title: "General benchmarks miss the point", body: "A model that scores well on MMLU can still fail at clinical reasoning, misidentify diseases, or hallucinate drug interactions. We test specifically for healthcare: facts, reasoning, evidence, and structured output." },
              { icon: "📂", title: "Open data, open scores", body: "Every eval uses a publicly licensed dataset. Every score comes from a results file checked into this repo. No proprietary data, no closed judging — just runs anyone can reproduce and verify." },
              { icon: "🤖", title: "RAG changes the picture", body: "Most health deployments use retrieval-augmented generation (RAG) to ground answers in clinical documents. We test JSON reliability and claim verification — the two capabilities that break first in real RAG pipelines." },
            ].map((c) => (
              <div key={c.title} className="why-card">
                <span className="why-icon">{c.icon}</span>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SubscribeForm />

      {/* Contribute */}
      <section className="wrap" id="contribute" aria-labelledby="contribute-h" style={{ paddingBottom: 72 }}>
        <p className="sec-label">Get involved</p>
        <div className="sec-head">
          <h2 id="contribute-h">Add your model in &lt; 1 hour</h2>
          <Link className="btn primary" href="/contribute">How to contribute</Link>
        </div>
        <p className="intro">
          Any open model that runs in <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">Ollama</a> can
          be evaluated and listed. No API keys, no cloud costs.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          <a className="btn primary" href="https://github.com/devankit01/healthllm/issues/new?template=add-model-catalog.yml" target="_blank" rel="noopener noreferrer">
            Add Model to Catalog
          </a>
          <a className="btn" href="https://github.com/devankit01/healthllm/issues/new?template=add-eval-results.yml" target="_blank" rel="noopener noreferrer">
            Submit Eval Scores
          </a>
          <a className="btn" href="https://github.com/devankit01/healthllm/issues/new?template=add-dataset.yml" target="_blank" rel="noopener noreferrer">
            Add Dataset
          </a>
        </div>
      </section>
    </>
  );
}
