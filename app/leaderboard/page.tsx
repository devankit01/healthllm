import { createClient } from "@/utils/supabase/server";
import type { EvalResult } from "@/types";
import type { Metadata } from "next";
import ScoresBanner from "@/components/ScoresBanner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Leaderboard — HealthLLM",
  description: "Health LLM benchmark scores across 7 clinical evals. Temperature 0, seed 42, 100 samples.",
};

const TIER1 = [
  { key: "med_knowledge",      label: "Med Knowledge",    short: "Med" },
  { key: "clinical_reasoning", label: "Clinical Reasoning", short: "Clinical" },
  { key: "evidence_reasoning", label: "Evidence",          short: "Evidence" },
  { key: "claim_verification", label: "Claims",            short: "Claims" },
  { key: "entity_extraction",  label: "NER (F1)",          short: "NER" },
  { key: "json_reliability",   label: "JSON",              short: "JSON" },
  { key: "consistency",        label: "Consistency",       short: "Consist." },
];

const TIER2 = [
  { key: "citation_grounding", label: "Citation F1", title: "Does the model cite passages that support its answer?" },
];

const KNOWN_PARAMS: Record<string, string> = {
  "mistral:latest": "7.2B", "mistral": "7.2B",
  "qwen2.5:7b": "7.6B", "deepseek-r1:7b": "7.6B",
  "llama3.2:3b": "3.2B", "llama3.1:8b": "8B", "llama3:8b": "8B",
  "phi3.5": "3.8B", "phi3.5:latest": "3.8B", "phi3": "3.8B",
  "gemma2:9b": "9B", "meditron:7b": "7B",
};

function inferParams(modelName: string): string {
  const lower = modelName.toLowerCase();
  for (const [k, v] of Object.entries(KNOWN_PARAMS)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  const m = lower.match(/(\d+\.?\d*)\s*b/);
  return m ? `${m[1]}B` : "—";
}

function grade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

function scoreColor(val: number): string {
  if (val >= 65) return "score-green";
  if (val >= 45) return "score-yellow";
  return "score-red";
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("eval_results")
    .select("*")
    .order("health_score", { ascending: false });

  const results: EvalResult[] = data ?? [];

  return (
    <>
      <ScoresBanner />
      <div className="wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <p className="sec-label">Leaderboard</p>
        <div className="sec-head">
          <h2>Health LLM Benchmark Scores</h2>
        </div>
        <p className="intro" style={{ marginBottom: 8 }}>
          Scores compare models under the same questions and settings — temperature&nbsp;0, seed&nbsp;42, 100 samples.
          {" "}<Link href="/methodology">How scoring works →</Link>
        </p>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: 24 }}>
          <strong>Tier 1</strong> (Health Score) = medical knowledge on standardised questions.{" "}
          <strong>Tier 2</strong> (Deployment Trust) = citation grounding, real notes, abstention — opt-in, not averaged in.
        </p>

        {results.length === 0 ? (
          <div className="notice demo">
            <p>No eval results yet. Run <code>python3 scripts/run_evals.py &lt;model&gt; --push</code> to be the first.</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table className="lb-table">
              <thead>
                <tr className="lb-group-row">
                  <th colSpan={3} />
                  <th colSpan={TIER1.length} className="lb-group-tier1">Tier 1 — Medical Knowledge</th>
                  <th colSpan={2} className="lb-group-score" />
                  <th colSpan={TIER2.length} className="lb-group-tier2">Tier 2 — Deployment Trust</th>
                </tr>
                <tr>
                  <th>#</th>
                  <th style={{ textAlign: "left" }}>Model</th>
                  <th>Size</th>
                  {TIER1.map((e) => <th key={e.key} title={e.label}>{e.short}</th>)}
                  <th>Health Score</th>
                  <th>Grade</th>
                  {TIER2.map((e) => <th key={e.key} title={e.title}>{e.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id} className="row">
                    <td className="rank">{i + 1}</td>
                    <td className="model">
                      <div><b>{r.model_name}</b></div>
                      {r.hardware && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: 2 }}>{r.hardware}</div>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-type">{inferParams(r.model_name)}</span>
                    </td>

                    {TIER1.map((e) => {
                      const val = r[e.key as keyof EvalResult] as number;
                      return (
                        <td key={e.key} className={`score ${val != null ? scoreColor(val) : ""}`}>
                          {val != null ? val.toFixed(1) : <span className="none">—</span>}
                        </td>
                      );
                    })}

                    <td className="rating">
                      <div className="health-score-cell">
                        <span className="health-score-num">{r.health_score?.toFixed(1) ?? "—"}</span>
                        {r.health_score != null && (
                          <div className="score-bar-wrap">
                            <div className="score-bar" style={{ width: `${Math.min(r.health_score, 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`grade g-${grade(r.health_score)}`}>
                        {grade(r.health_score)}
                      </span>
                    </td>

                    {TIER2.map((e) => {
                      const val = r[e.key as keyof EvalResult] as number;
                      return (
                        <td key={e.key} className={`score ${val != null ? scoreColor(val) : ""}`}>
                          {val != null ? val.toFixed(1) : <span className="none" title="Run with --grounding">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: 24, fontSize: "13px", color: "var(--muted)" }}>
          Tier 2 scores show <span className="none" style={{ fontSize: "12px", padding: "1px 6px" }}>—</span> until a model is run with <code>--grounding</code>, <code>--notes</code>, or <code>--abstention</code>.
          {" "}<a href="https://github.com/devankit01/healthllm/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Submit your model →</a>
        </p>
      </div>
    </>
  );
}
