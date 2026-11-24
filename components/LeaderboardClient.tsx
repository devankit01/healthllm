"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { EvalResult } from "@/types";

// ── constants ──────────────────────────────────────────────────────────────────

const TIER1 = [
  { key: "med_knowledge",      label: "Med",      full: "Medical Knowledge" },
  { key: "clinical_reasoning", label: "Clinical", full: "Clinical Reasoning" },
  { key: "evidence_reasoning", label: "Evidence", full: "Evidence Reasoning" },
  { key: "claim_verification", label: "Claims",   full: "Claim Verification" },
  { key: "entity_extraction",  label: "NER",      full: "Named Entity (F1)" },
  { key: "json_reliability",   label: "JSON",     full: "JSON Reliability" },
  { key: "consistency",        label: "Consist.", full: "Consistency" },
];

const TIER2 = [
  { key: "safety_refusal",     label: "Safety",   full: "Safety Refusal" },
  { key: "abstention",         label: "Abstain",  full: "Epistemic Abstention" },
  { key: "citation_grounding", label: "Citation", full: "Citation Grounding" },
];

// ── helpers ────────────────────────────────────────────────────────────────────

function inferSize(name: string): string {
  const m = name.toLowerCase().match(/(\d+\.?\d*)\s*b/);
  return m ? `${m[1]}B` : "—";
}

function sizeNum(s: string): number {
  const m = s.match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : 999;
}

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

function ciOverlaps(a: EvalResult, b: EvalResult): boolean {
  const [aLo, aHi] = wilsonCI(a.health_score, a.samples ?? 100);
  const [bLo, bHi] = wilsonCI(b.health_score, b.samples ?? 100);
  return aLo <= bHi && bLo <= aHi;
}

function scoreChip(val: number | null | undefined) {
  if (val == null) return <span className="lb-chip lb-chip-na">—</span>;
  const cls = val >= 65 ? "lb-chip-green" : val >= 45 ? "lb-chip-yellow" : "lb-chip-red";
  return <span className={`lb-chip ${cls}`}>{val.toFixed(1)}</span>;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── main component ─────────────────────────────────────────────────────────────

export default function LeaderboardClient({ results }: { results: EvalResult[] }) {
  const [search, setSearch]     = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [sortKey, setSortKey]   = useState("health_score");
  const [sortDir, setSortDir]   = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    return results
      .filter(r => {
        if (r.is_preview || r.duplicate_of) return false;
        if (search && !r.model_name.toLowerCase().includes(search.toLowerCase())) return false;
        if (sizeFilter !== "all") {
          const n = sizeNum(inferSize(r.model_name));
          if (sizeFilter === "small" && n > 4) return false;
          if (sizeFilter === "medium" && (n <= 4 || n > 8)) return false;
          if (sizeFilter === "large" && n <= 8) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const av = (a[sortKey as keyof EvalResult] as number) ?? -1;
        const bv = (b[sortKey as keyof EvalResult] as number) ?? -1;
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [results, search, sizeFilter, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <span className="lb-sort-icon">↕</span>;
    return <span className="lb-sort-icon active">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="lb-bar">
        <div className="lb-search-wrap">
          <svg className="lb-search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="lb-search"
            placeholder="Search models…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="lb-select" value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}>
          <option value="all">All sizes</option>
          <option value="small">≤ 4B</option>
          <option value="medium">4–8B</option>
          <option value="large">&gt; 8B</option>
        </select>
        <select className="lb-select" value={sortKey} onChange={e => { setSortKey(e.target.value); setSortDir("desc"); }}>
          <option value="health_score">Health Score</option>
          <option value="med_knowledge">Med Knowledge</option>
          <option value="clinical_reasoning">Clinical</option>
          <option value="safety_refusal">Safety</option>
          <option value="abstention">Abstention</option>
          <option value="citation_grounding">Citation</option>
        </select>
        <span className="lb-count">{filtered.length} model{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table ── */}
      <div className="lbt-wrap">
        <table className="lbt">
          <thead>
            <tr className="lbt-group">
              <th colSpan={3} />
              <th colSpan={TIER1.length} className="lbt-group-t1">Tier 1 — Health Score</th>
              <th />
              <th colSpan={TIER2.length} className="lbt-group-t2">Tier 2 — Deployment Trust</th>
            </tr>
            <tr className="lbt-head">
              <th className="lbt-th-rank">#</th>
              <th className="lbt-th-model" onClick={() => toggleSort("model_name")} style={{cursor:"pointer"}}>
                Model <SortIcon col="model_name" />
              </th>
              <th className="lbt-th-size">Size</th>
              {TIER1.map(e => (
                <th key={e.key} className="lbt-th-score" title={e.full} onClick={() => toggleSort(e.key)} style={{cursor:"pointer"}}>
                  {e.label} <SortIcon col={e.key} />
                </th>
              ))}
              <th className="lbt-th-hs" onClick={() => toggleSort("health_score")} style={{cursor:"pointer"}}>
                Score <SortIcon col="health_score" />
              </th>
              {TIER2.map(e => (
                <th key={e.key} className="lbt-th-score" title={e.full} onClick={() => toggleSort(e.key)} style={{cursor:"pointer"}}>
                  {e.label} <SortIcon col={e.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const prev = filtered[i - 1];
              const tiedAbove = prev ? ciOverlaps(r, prev) : false;
              const [lo, hi] = wilsonCI(r.health_score, r.samples ?? 100);
              const size = inferSize(r.model_name);
              return (
                <tr key={r.id} className="lbt-row">
                  <td className="lbt-td-rank">
                    <span className={tiedAbove ? "lbt-rank-tied" : "lbt-rank"} title={tiedAbove ? `CI overlaps with #${i} — not statistically distinguishable` : undefined}>
                      {tiedAbove ? `~${i + 1}` : i + 1}
                    </span>
                  </td>
                  <td className="lbt-td-model">
                    <Link href={`/leaderboard/${r.model_id}`} className="lbt-model-link">
                      <span className="lbt-model-name">{r.model_name}</span>
                      {r.submitted_at && (
                        <span className="lbt-model-date">{formatDate(r.submitted_at)}</span>
                      )}
                    </Link>
                  </td>
                  <td className="lbt-td-size">
                    <span className="lbt-size-chip">{size}</span>
                  </td>
                  {TIER1.map(e => (
                    <td key={e.key} className="lbt-td-score">
                      {scoreChip(r[e.key as keyof EvalResult] as number)}
                    </td>
                  ))}
                  <td className="lbt-td-hs">
                    <div className="lbt-hs">
                      <span className="lbt-hs-num">{r.health_score?.toFixed(1) ?? "—"}</span>
                      <div className="lbt-hs-bar-wrap">
                        <div className="lbt-hs-bar" style={{ width: `${Math.min(r.health_score ?? 0, 100)}%` }} />
                      </div>
                      <span className="lbt-hs-ci">[{lo}–{hi}]</span>
                    </div>
                  </td>
                  {TIER2.map(e => (
                    <td key={e.key} className="lbt-td-score">
                      {scoreChip(r[e.key as keyof EvalResult] as number)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
