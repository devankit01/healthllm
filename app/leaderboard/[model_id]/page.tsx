import { createClient } from "@/utils/supabase/server";
import type { EvalResult } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

function wilsonCI(score: number, n: number): [number, number] {
  if (!n || score == null) return [0, 0];
  const z = 1.96, p = score / 100, denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [
    Math.round(Math.max(0, centre - margin) * 1000) / 10,
    Math.round(Math.min(1, centre + margin) * 1000) / 10,
  ];
}

function grade(s: number): { label: string; cls: string } {
  if (s >= 65) return { label: "A", cls: "g-A" };
  if (s >= 50) return { label: "B", cls: "g-B" };
  if (s >= 35) return { label: "C", cls: "g-C" };
  if (s >= 20) return { label: "D", cls: "g-D" };
  return { label: "E", cls: "g-E" };
}

function ScoreBar({ val, n }: { val: number; n: number }) {
  const [lo, hi] = wilsonCI(val, n);
  const color = val >= 65 ? "#16a34a" : val >= 45 ? "#ca8a04" : "#dc2626";
  return (
    <div className="mdl-score-row">
      <div className="mdl-score-bar-bg">
        <div className="mdl-score-bar-fill" style={{ width: `${val}%`, background: color }} />
      </div>
      <span className="mdl-score-num" style={{ color }}>{val.toFixed(1)}%</span>
      <span className="mdl-score-ci">[{lo}–{hi}]</span>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mdl-meta-item">
      <dt className="mdl-meta-label">{label}</dt>
      <dd className="mdl-meta-value">{value}</dd>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ model_id: string }> }): Promise<Metadata> {
  const { model_id } = await params;
  return {
    title: `${model_id} — HealthLLM Leaderboard`,
    description: `Health benchmark scores for ${model_id}`,
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ model_id: string }> }) {
  const { model_id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("eval_results")
    .select("*")
    .eq("model_id", model_id)
    .single();

  if (!data) notFound();
  const r = data as EvalResult;
  const n = r.samples ?? 100;

  // Load model notes
  let notes: string | null = null;
  try {
    const notePath = path.join(process.cwd(), "docs", "models", `${model_id}.md`);
    notes = fs.readFileSync(notePath, "utf-8");
  } catch {}

  const g = grade(r.health_score);
  const [lo, hi] = wilsonCI(r.health_score, n);

  const tier1 = [
    { key: "med_knowledge",      label: "Medical Knowledge",   desc: "MedMCQA — 4-way MCQ on clinical topics" },
    { key: "clinical_reasoning", label: "Clinical Reasoning",  desc: "MedQA USMLE — clinical step exam questions" },
    { key: "evidence_reasoning", label: "Evidence Reasoning",  desc: "PubMedQA — yes/no/maybe over abstracts" },
    { key: "claim_verification", label: "Claim Verification",  desc: "PubHealth — true/false/unproven/mixture" },
    { key: "entity_extraction",  label: "Named Entity (F1)",   desc: "NCBI Disease — NER recall/precision" },
    { key: "json_reliability",   label: "JSON Reliability",    desc: "% of entity responses valid JSON" },
    { key: "consistency",        label: "Consistency",         desc: "Same Q with shuffled choices — agreement" },
  ];

  const tier2 = [
    { key: "safety_refusal",     label: "Safety Refusal",      desc: "Balanced accuracy — refuses harmful, answers benign" },
    { key: "abstention",         label: "Epistemic Abstention", desc: "% of unanswerable clinical notes correctly abstained" },
    { key: "citation_grounding", label: "Citation Grounding",  desc: "PubMedQA passage F1 — cites the right source" },
  ];

  return (
    <div className="mdl-page">
      {/* ── Back ── */}
      <div className="wrap">
        <div className="mdl-back">
          <Link href="/leaderboard" className="mdl-back-link">
            ← Leaderboard
          </Link>
        </div>

        {/* ── Header ── */}
        <div className="mdl-header">
          <div className="mdl-header-left">
            <div className="mdl-badges">
              {r.quantization && <span className="mdl-badge mdl-badge-quant">{r.quantization}</span>}
              {r.parameter_size && <span className="mdl-badge mdl-badge-size">{r.parameter_size}</span>}
              {r.parser_mode === "lenient_strip_thinking" && (
                <span className="mdl-badge mdl-badge-cot">chain-of-thought</span>
              )}
            </div>
            <h1 className="mdl-title">{r.model_name}</h1>
            <div className="mdl-subtitle">
              <span>n={n} · temp=0 · seed={r.seed}</span>
              {r.submitted_at && (
                <span>Evaluated {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              )}
            </div>
          </div>
          <div className="mdl-header-score">
            <div className={`mdl-grade ${g.cls}`}>{g.label}</div>
            <div className="mdl-hs-num">{r.health_score?.toFixed(1)}</div>
            <div className="mdl-hs-label">Health Score</div>
            <div className="mdl-hs-ci">95% CI [{lo}–{hi}]</div>
          </div>
        </div>

        {/* ── Scores ── */}
        <div className="mdl-scores-grid">
          {/* Tier 1 */}
          <div className="mdl-scores-panel">
            <div className="mdl-panel-label mdl-panel-t1">Tier 1 — Health Score (weighted)</div>
            <div className="mdl-score-list">
              {tier1.map(e => {
                const val = r[e.key as keyof EvalResult] as number;
                return (
                  <div key={e.key} className="mdl-score-item">
                    <div className="mdl-score-item-head">
                      <span className="mdl-score-item-label">{e.label}</span>
                      <span className="mdl-score-item-desc">{e.desc}</span>
                    </div>
                    {val != null
                      ? <ScoreBar val={val} n={n} />
                      : <span className="mdl-score-na">Not run</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier 2 */}
          <div className="mdl-scores-panel">
            <div className="mdl-panel-label mdl-panel-t2">Tier 2 — Deployment Trust (not in score)</div>
            <div className="mdl-score-list">
              {tier2.map(e => {
                const val = r[e.key as keyof EvalResult] as number;
                return (
                  <div key={e.key} className="mdl-score-item">
                    <div className="mdl-score-item-head">
                      <span className="mdl-score-item-label">{e.label}</span>
                      <span className="mdl-score-item-desc">{e.desc}</span>
                    </div>
                    {val != null
                      ? <ScoreBar val={val} n={n} />
                      : <span className="mdl-score-na">Not run</span>
                    }
                  </div>
                );
              })}
            </div>

            {/* Strict vs lenient score comparison */}
            {r.scores_strict && Object.keys(r.scores_strict).length > 0 && (
              <div className="mdl-parse-rates">
                <div className="mdl-panel-sublabel">Strict vs lenient parser scores</div>
                <div className="mdl-parse-rate-row mdl-parse-rate-header">
                  <span className="mdl-parse-rate-key">eval</span>
                  <span className="mdl-parse-rate-val">strict</span>
                  <span className="mdl-parse-rate-val">lenient</span>
                </div>
                {Object.entries(r.scores_strict).map(([k, strictVal]) => {
                  const lenientVal = r[k as keyof EvalResult] as number | undefined;
                  const diff = lenientVal != null ? lenientVal - strictVal : 0;
                  return (
                    <div key={k} className="mdl-parse-rate-row">
                      <span className="mdl-parse-rate-key">{k.replace(/_/g, " ")}</span>
                      <span className={`mdl-parse-rate-val ${strictVal < 20 ? "mdl-parse-warn" : ""}`}>
                        {strictVal.toFixed(1)}%
                      </span>
                      <span className="mdl-parse-rate-val">
                        {lenientVal != null ? lenientVal.toFixed(1) : "—"}%
                        {diff > 1 ? <span className="mdl-parse-gain"> +{diff.toFixed(1)}</span> : null}
                      </span>
                    </div>
                  );
                })}
                <p className="mdl-parse-note">
                  Strict: answer must match explicit pattern. Lenient: strips {"<think>"} blocks, falls back to last letter. For non-reasoning models these are identical.
                </p>
              </div>
            )}

            {/* Parse rates if available */}
            {r.parse_rates && Object.keys(r.parse_rates).length > 0 && (
              <div className="mdl-parse-rates">
                <div className="mdl-panel-sublabel">Parse rates (% replies extracted)</div>
                {Object.entries(r.parse_rates).map(([k, v]) => {
                  const sv = r.parse_rates_strict?.[k];
                  return (
                    <div key={k} className="mdl-parse-rate-row">
                      <span className="mdl-parse-rate-key">{k.replace(/_/g, " ")}</span>
                      <span className={`mdl-parse-rate-val ${(v as number) < 80 ? "mdl-parse-warn" : ""}`}>
                        {(v as number).toFixed(1)}%{(v as number) < 80 ? " ⚠" : ""}
                        {sv != null && sv < (v as number) ? <span className="mdl-muted"> (strict: {sv.toFixed(1)}%)</span> : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Metadata ── */}
        <div className="mdl-meta-panel">
          <div className="mdl-panel-label">Run metadata</div>
          <dl className="mdl-meta-grid">
            <MetaItem label="Hardware" value={r.hardware || <em className="mdl-muted">not specified</em>} />
            <MetaItem label="Ollama version" value={r.ollama_version} />
            <MetaItem label="Quantization" value={r.quantization} />
            <MetaItem label="Parameters" value={r.parameter_size} />
            <MetaItem label="Samples" value={r.samples} />
            <MetaItem label="Parser mode" value={r.parser_mode ?? "strict"} />
            <MetaItem label="Submitted by" value={r.submitted_by} />
            <MetaItem label="Model ID" value={<code className="mdl-code">{r.model_id}</code>} />
          </dl>
        </div>

        {/* ── Notes ── */}
        {notes && (
          <div className="mdl-notes-panel">
            <div className="mdl-panel-label">Model notes</div>
            <div className="model-notes-md" dangerouslySetInnerHTML={{ __html: renderNotes(notes) }} />
          </div>
        )}

        {/* ── Footer nav ── */}
        <div className="mdl-footer-nav">
          <Link href="/leaderboard" className="btn">← Back to leaderboard</Link>
          <Link href="/methodology" className="btn">How scoring works →</Link>
        </div>
      </div>
    </div>
  );
}

// Very simple markdown-to-html for notes (just for headings, bold, lists, paragraphs)
function renderNotes(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>");
}
