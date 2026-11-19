import { createClient } from "@/utils/supabase/server";
import type { EvalResult } from "@/types";
import type { Metadata } from "next";
import ScoresBanner from "@/components/ScoresBanner";
import LeaderboardClient from "@/components/LeaderboardClient";
import Link from "next/link";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Leaderboard — HealthLLM",
  description: "Health LLM benchmark scores across 7 clinical evals. Temperature 0, seed 42, 100 samples.",
};

function loadModelNotes(): Record<string, string> {
  const dir = path.join(process.cwd(), "docs", "models");
  const notes: Record<string, string> = {};
  try {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md") || file === "README.md") continue;
      const id = file.replace(".md", "");
      notes[id] = fs.readFileSync(path.join(dir, file), "utf-8");
    }
  } catch {}
  return notes;
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("eval_results")
    .select("*")
    .order("health_score", { ascending: false });

  const results: EvalResult[] = data ?? [];
  const modelNotes = loadModelNotes();

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
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: 12 }}>
          <strong>Tier 1</strong> (Health Score) = weighted average across 7 medical evals.{" "}
          <strong>Tier 2</strong> (Deployment Trust) = citation grounding, safety refusal, abstention — not averaged in.
        </p>
        <div style={{ background: "var(--surface, #f5f7ff)", border: "1px solid var(--border, #e0e4f0)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: "13px" }}>
          <strong>We&apos;re building this framework openly with the community.</strong>{" "}
          The goal: a benchmark that tells you not just whether a model knows medicine, but whether it&apos;s safe to deploy.{" "}
          <a href="https://docs.google.com/document/d/1cEEN00Gz4nnF5wBDh9R7oINvj2cWRMIRa0BFC63a7VA/edit" target="_blank" rel="noopener noreferrer">Read the white paper →</a>
        </div>

        {results.length === 0 ? (
          <div className="notice demo">
            <p>No eval results yet. Run <code>python3 scripts/run_evals.py &lt;model&gt; --push</code> to be the first.</p>
          </div>
        ) : (
          <LeaderboardClient results={results} modelNotes={modelNotes} />
        )}

        <p style={{ marginTop: 24, fontSize: "13px", color: "var(--muted)" }}>
          Health Score uses weighted average (Med Knowledge 20%, Clinical 20%, Evidence 15%, Claims 15%, NER 15%, Consistency 10%, JSON 5%).
          95% Wilson confidence intervals shown on each score.{" "}
          <a href="https://github.com/devankit01/healthllm/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Submit your model →</a>
        </p>
      </div>
    </>
  );
}
