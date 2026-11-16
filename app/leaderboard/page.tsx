import { createClient } from "@/utils/supabase/server";
import type { EvalResult } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — HealthLLM",
  description: "Reproducible health LLM benchmark scores across 7 clinical evals.",
};

const EVALS = [
  { key: "med_knowledge", label: "Med Knowledge" },
  { key: "clinical_reasoning", label: "Clinical Reasoning" },
  { key: "evidence_reasoning", label: "Evidence" },
  { key: "claim_verification", label: "Claims" },
  { key: "entity_extraction", label: "NER" },
  { key: "json_reliability", label: "JSON" },
  { key: "consistency", label: "Consistency" },
];

const KNOWN_PARAMS: Record<string, string> = {
  "mistral:latest": "7.2B",
  "mistral": "7.2B",
  "qwen2.5:7b": "7.6B",
  "deepseek-r1:7b": "7.6B",
  "llama3.1:8b": "8B",
  "llama3:8b": "8B",
  "phi3.5": "3.8B",
  "phi3": "3.8B",
  "gemma2:9b": "9B",
  "meditron:7b": "7B",
};

function inferParams(modelName: string): string {
  const lower = modelName.toLowerCase();
  for (const [k, v] of Object.entries(KNOWN_PARAMS)) {
    if (lower.includes(k)) return v;
  }
  const m = lower.match(/(\d+\.?\d*)\s*b/);
  return m ? `${m[1]}B` : "—";
}

function grade(score: number) {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("eval_results")
    .select("*")
    .order("health_score", { ascending: false });

  const results: EvalResult[] = data ?? [];

  return (
    <div className="wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <p className="sec-label">Leaderboard</p>
      <div className="sec-head">
        <h2>Health LLM Benchmark Scores</h2>
      </div>
      <p className="intro">
        All scores reproducible: temperature&nbsp;0, seed&nbsp;42, 100 samples per eval.
        {" "}<a href="https://github.com/devankit01/healthllm#submitting-eval-results">Submit your model →</a>
      </p>

      {results.length === 0 ? (
        <div className="notice demo">
          <p>No eval results yet. Be the first to submit scores using <code>evals/run_eval.py</code>.</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th style={{ textAlign: "left" }}>Model</th>
                <th>Params</th>
                {EVALS.map((e) => <th key={e.key}>{e.label}</th>)}
                <th>Health Score</th>
                <th>Grade</th>
                <th title="Citation F1 — does the model cite passages that support its answer?">Cite F1</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} className="row">
                  <td className="rank">{i + 1}</td>
                  <td className="model">
                    <b>{r.model_name}</b>
                    </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="badge badge-type">{inferParams(r.model_name)}</span>
                    <span>{r.hardware}</span>
                  </td>
                  {EVALS.map((e) => {
                    const val = r[e.key as keyof EvalResult] as number;
                    return (
                      <td key={e.key} className="score">
                        {val != null ? val.toFixed(1) : <span className="none">—</span>}
                      </td>
                    );
                  })}
                  <td className="rating">{r.health_score?.toFixed(1) ?? "—"}</td>
                  <td>
                    <span className={`grade g-${grade(r.health_score)}`}>
                      {grade(r.health_score)}
                    </span>
                  </td>
                  <td className="score">
                    {r.citation_grounding != null
                      ? r.citation_grounding.toFixed(1)
                      : <span className="none">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
