"use client";
import { useState, useMemo } from "react";
import { marked } from "marked";
import type { EvalResult } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────

const TIER1 = [
  { key: "med_knowledge",      label: "Med Knowledge",    short: "Med" },
  { key: "clinical_reasoning", label: "Clinical Reasoning", short: "Clinical" },
  { key: "evidence_reasoning", label: "Evidence Reasoning", short: "Evidence" },
  { key: "claim_verification", label: "Claim Verification", short: "Claims" },
  { key: "entity_extraction",  label: "NER (F1)",          short: "NER" },
  { key: "json_reliability",   label: "JSON Reliability",  short: "JSON" },
  { key: "consistency",        label: "Consistency",        short: "Consist." },
];

const TIER2 = [
  { key: "citation_grounding", label: "Citation F1",    desc: "Does the model cite passages that support its answer?" },
  { key: "safety_refusal",     label: "Safety Refusal", desc: "Balanced accuracy on harmful vs benign prompts" },
  { key: "abstention",         label: "Abstention",     desc: "Correctly says 'not stated' on unanswerable questions" },
];

const SIZE_TAGS: Record<string, string> = {
  "0.8b": "< 1B", "3b": "3B", "3.2b": "3B", "3.8b": "4B", "4b": "4B",
  "7b": "7B", "7.2b": "7B", "7.6b": "7B", "8b": "8B",
};

function inferSize(name: string): string {
  const m = name.toLowerCase().match(/(\d+\.?\d*)\s*b/);
  if (!m) return "—";
  return `${m[1]}B`;
}

function sizeNum(s: string): number {
  const m = s.match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : 999;
}

function grade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

function scoreColor(val: number): string {
  if (val >= 65) return "#22c55e";
  if (val >= 45) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(val: number): string {
  if (val >= 65) return "#f0fdf4";
  if (val >= 45) return "#fffbeb";
  return "#fef2f2";
}

function modelTags(r: EvalResult): string[] {
  const tags: string[] = [];
  const name = r.model_name.toLowerCase();
  if (name.includes("meditron") || name.includes("openbiollm") || name.includes("biomistral") || name.includes("medgemma")) tags.push("medical");
  else tags.push("general");
  if (sizeNum(inferSize(r.model_name)) <= 4) tags.push("small");
  else if (sizeNum(inferSize(r.model_name)) <= 8) tags.push("medium");
  else tags.push("large");
  if ((r.json_reliability ?? 0) >= 90) tags.push("structured output");
  if ((r.citation_grounding ?? 0) >= 50) tags.push("citation");
  if ((r.safety_refusal ?? 0) >= 70) tags.push("safety");
  if ((r.abstention ?? 0) >= 80) tags.push("abstention");
  return tags;
}

function wilsonCI(score: number, n: number): [number, number] {
  if (!n || score == null) return [0, 0];
  const z = 1.96, p = score / 100, denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.round(Math.max(0, centre - margin) * 1000) / 10, Math.round(Math.min(1, centre + margin) * 1000) / 10];
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, n }: { label: string; value: number | null; n: number }) {
  const val = value ?? 0;
  const hasVal = value != null;
  const [lo, hi] = hasVal ? wilsonCI(val, n) : [0, 0];
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span style={{ fontWeight: 600, color: hasVal ? scoreColor(val) : "var(--muted)" }}>
          {hasVal ? `${val.toFixed(1)}%` : "—"}
        </span>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, position: "relative" }}>
        {hasVal && (
          <div style={{
            background: scoreColor(val),
            width: `${Math.min(val, 100)}%`,
            height: "100%",
            borderRadius: 4,
            transition: "width 0.3s",
          }} />
        )}
      </div>
      {hasVal && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>[{lo}–{hi}]</div>}
    </div>
  );
}

// ── ModelCard ─────────────────────────────────────────────────────────────────

function ModelCard({ r, rank, onClick }: { r: EvalResult; rank: number; onClick: () => void }) {
  const size = inferSize(r.model_name);
  const g = grade(r.health_score);
  const tags = modelTags(r);

  return (
    <div
      className="model-card"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>#{rank}</span>
            <span className={`grade g-${g}`}>{g}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{r.model_name}</div>
          {r.hardware && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{r.hardware}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 28, fontWeight: 800, lineHeight: 1,
            color: scoreColor(r.health_score),
          }}>{r.health_score?.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>health score</div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        <span className="badge badge-type">{size}</span>
        {tags.map(t => <span key={t} className="badge" style={{ fontSize: 10 }}>{t}</span>)}
      </div>

      {/* T1 score bars */}
      <div>
        {TIER1.map(e => (
          <ScoreBar
            key={e.key}
            label={e.short}
            value={r[e.key as keyof EvalResult] as number ?? null}
            n={r.samples ?? 100}
          />
        ))}
      </div>

      {/* T2 pills */}
      {(r.citation_grounding != null || r.safety_refusal != null || r.abstention != null) && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Deployment Trust</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TIER2.map(e => {
              const val = r[e.key as keyof EvalResult] as number;
              if (val == null) return null;
              return (
                <div key={e.key} style={{
                  background: scoreBg(val), border: `1px solid ${scoreColor(val)}40`,
                  borderRadius: 6, padding: "4px 8px", fontSize: 11,
                }}>
                  <span style={{ color: "var(--muted)" }}>{e.label}: </span>
                  <span style={{ fontWeight: 700, color: scoreColor(val) }}>{val.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>
        View model notes →
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ModelModal({ r, notes, onClose }: { r: EvalResult; notes: string | null; onClose: () => void }) {
  const size = inferSize(r.model_name);
  const tags = modelTags(r);
  const html = notes ? marked.parse(notes) as string : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>{r.model_name}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <span className="badge badge-type">{size}</span>
              {tags.map(t => <span key={t} className="badge" style={{ fontSize: 11 }}>{t}</span>)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: scoreColor(r.health_score) }}>
              {r.health_score?.toFixed(1)}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>health score</div>
            <span className={`grade g-${grade(r.health_score)}`} style={{ marginTop: 4, display: "inline-block" }}>
              {grade(r.health_score)}
            </span>
          </div>
        </div>

        {/* Two-column scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Tier 1 — Medical Knowledge</div>
            {TIER1.map(e => (
              <ScoreBar key={e.key} label={e.label} value={r[e.key as keyof EvalResult] as number ?? null} n={r.samples ?? 100} />
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Tier 2 — Deployment Trust</div>
            {TIER2.map(e => (
              <ScoreBar key={e.key} label={e.label} value={r[e.key as keyof EvalResult] as number ?? null} n={r.samples ?? 100} />
            ))}
            <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)" }}>
              <div>Quantization: <strong>{r.quantization ?? "—"}</strong></div>
              <div>Samples: <strong>{r.samples}</strong> · Seed: <strong>{r.seed}</strong></div>
              {r.ollama_version && <div>Ollama: <strong>{r.ollama_version}</strong></div>}
            </div>
          </div>
        </div>

        {/* Markdown notes */}
        {html ? (
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Model Notes</div>
            <div
              className="model-notes-md"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, fontSize: 13, color: "var(--muted)" }}>
            No model notes available.{" "}
            <a href="https://github.com/devankit01/healthllm/tree/main/docs/models" target="_blank" rel="noopener noreferrer">
              Add notes on GitHub →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeaderboardClient({
  results,
  modelNotes,
}: {
  results: EvalResult[];
  modelNotes: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("health_score");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [activeModel, setActiveModel] = useState<EvalResult | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    results.forEach(r => modelTags(r).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [results]);

  const filtered = useMemo(() => {
    return results
      .filter(r => {
        if (search && !r.model_name.toLowerCase().includes(search.toLowerCase())) return false;
        if (sizeFilter !== "all") {
          const n = sizeNum(inferSize(r.model_name));
          if (sizeFilter === "small" && n > 4) return false;
          if (sizeFilter === "medium" && (n <= 4 || n > 8)) return false;
          if (sizeFilter === "large" && n <= 8) return false;
        }
        if (tagFilter !== "all" && !modelTags(r).includes(tagFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = (a[sortBy as keyof EvalResult] as number) ?? -1;
        const bVal = (b[sortBy as keyof EvalResult] as number) ?? -1;
        return bVal - aVal;
      });
  }, [results, search, sizeFilter, tagFilter, sortBy]);

  return (
    <>
      {/* Filter bar */}
      <div className="lb-filters">
        <input
          className="lb-search"
          placeholder="Search models..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="lb-select" value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}>
          <option value="all">All sizes</option>
          <option value="small">Small (≤ 4B)</option>
          <option value="medium">Medium (4–8B)</option>
          <option value="large">Large (&gt; 8B)</option>
        </select>
        <select className="lb-select" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
          <option value="all">All tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="lb-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="health_score">Sort: Health Score</option>
          <option value="med_knowledge">Sort: Med Knowledge</option>
          <option value="clinical_reasoning">Sort: Clinical</option>
          <option value="citation_grounding">Sort: Citation F1</option>
          <option value="safety_refusal">Sort: Safety Refusal</option>
          <option value="abstention">Sort: Abstention</option>
        </select>
        <div className="lb-view-toggle">
          <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>Cards</button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        {filtered.length} model{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Cards view */}
      {view === "cards" && (
        <div className="lb-cards-grid">
          {filtered.map((r, i) => (
            <ModelCard
              key={r.id}
              r={r}
              rank={i + 1}
              onClick={() => setActiveModel(r)}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="table-wrap">
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
                {TIER1.map(e => <th key={e.key} title={e.label}>{e.short}</th>)}
                <th>Health Score</th>
                <th>Grade</th>
                {TIER2.map(e => <th key={e.key}>{e.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const [lo, hi] = wilsonCI(r.health_score, r.samples ?? 100);
                return (
                  <tr key={r.id} className="row" style={{ cursor: "pointer" }} onClick={() => setActiveModel(r)}>
                    <td className="rank">{i + 1}</td>
                    <td className="model">
                      <div><b>{r.model_name}</b></div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
                        {modelTags(r).map(t => <span key={t} className="badge" style={{ fontSize: 10 }}>{t}</span>)}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-type">{inferSize(r.model_name)}</span>
                    </td>
                    {TIER1.map(e => {
                      const val = r[e.key as keyof EvalResult] as number;
                      const [clo, chi] = val != null ? wilsonCI(val, r.samples ?? 100) : [0, 0];
                      return (
                        <td key={e.key} className={`score ${val != null ? (val >= 65 ? "score-green" : val >= 45 ? "score-yellow" : "score-red") : ""}`}
                          title={val != null ? `${e.label}: ${val.toFixed(1)}%  95% CI [${clo}–${chi}]` : undefined}>
                          {val != null ? val.toFixed(1) : <span className="none">—</span>}
                        </td>
                      );
                    })}
                    <td className="rating">
                      <div className="health-score-cell">
                        <span className="health-score-num">{r.health_score?.toFixed(1) ?? "—"}</span>
                        <div className="score-bar-wrap">
                          <div className="score-bar" style={{ width: `${Math.min(r.health_score, 100)}%` }} />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>[{lo}–{hi}]</div>
                      </div>
                    </td>
                    <td><span className={`grade g-${grade(r.health_score)}`}>{grade(r.health_score)}</span></td>
                    {TIER2.map(e => {
                      const val = r[e.key as keyof EvalResult] as number;
                      return (
                        <td key={e.key} className={`score ${val != null ? (val >= 65 ? "score-green" : val >= 45 ? "score-yellow" : "score-red") : ""}`}>
                          {val != null ? val.toFixed(1) : <span className="none">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {activeModel && (
        <ModelModal
          r={activeModel}
          notes={modelNotes[activeModel.model_id] ?? null}
          onClose={() => setActiveModel(null)}
        />
      )}
    </>
  );
}
